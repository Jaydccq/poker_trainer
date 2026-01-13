import {
  MultiplayerRoom,
  MultiplayerGameState,
  MultiplayerEvent,
  SessionHistory,
  RoundHistory,
  PlayerRoundActions,
  HandHistory,
  DecisionHistory,
} from "@/types/multiplayer";
import { Action, Hand, Card, RoundResult } from "@/types";
import { createShoe, dealCard } from "@/utils/deck";
import { createHand, calculateTotal } from "@/utils/hand";
import { recommendAction, StrategyContext } from "@/utils/strategy";
import { RoomManager } from "@/lib/redis/client";

/**
 * MultiplayerGameEngine handles all game logic for multiplayer blackjack
 */
export class MultiplayerGameEngine {
  private room: MultiplayerRoom;
  private history: SessionHistory | null = null;

  constructor(room: MultiplayerRoom) {
    this.room = room;
  }

  /**
   * Start a new game session
   */
  async startSession(): Promise<MultiplayerGameState> {
    const shoe = createShoe(this.room.settings.rules.decks);

    // Initialize session history
    this.history = {
      roomCode: this.room.roomCode,
      sessionId: `${this.room.roomCode}-${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      players: Object.keys(this.room.players),
      rounds: [],
    };

    const gameState: MultiplayerGameState = {
      shoe,
      dealerHand: createHand([]),
      dealerHoleCardRevealed: false,
      playerHandsMap: {},
      currentPlayerId: null,
      currentHandIndex: 0,
      turnStartTime: null,
      turnTimeoutAt: null,
      phase: "betting",
      roundNumber: 1,
      bets: {},
      skippedPlayers: {},
      roundResults: {},
      runningCount: 0,
      trueCount: 0,
    };

    this.room.gameState = gameState;
    this.room.state = "playing";
    await RoomManager.updateRoom(this.room);

    return gameState;
  }

  /**
   * Start a new round (betting phase)
   */
  async startRound(): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];

    if (!this.room.gameState) {
      throw new Error("Game not started");
    }

    this.room.gameState.phase = "betting";
    this.room.gameState.bets = {};
    this.room.gameState.playerHandsMap = {};
    this.room.gameState.dealerHand = createHand([]);
    this.room.gameState.dealerHoleCardRevealed = false;

    events.push({
      type: "game:roundStart",
      roundNumber: this.room.gameState.roundNumber,
    });

    await RoomManager.updateRoom(this.room);

    return events;
  }

  /**
   * Place a bet for a player
   */
  async placeBet(playerId: string, amount: number): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState;

    if (!state || (state.phase !== "betting" && state.phase !== "results")) {
      throw new Error("Not in betting phase");
    }

    const player = this.room.players[playerId];
    if (!player) {
      throw new Error("Player not found");
    }

    // Validate bet amount
    if (
      amount < this.room.settings.minBet ||
      amount > this.room.settings.maxBet
    ) {
      throw new Error(
        `Bet must be between $${this.room.settings.minBet} and $${this.room.settings.maxBet}`
      );
    }

    if (amount > player.bankroll) {
      throw new Error("Insufficient funds");
    }

    // If we're in results phase, transition to betting phase first
    // This clears old bets and hands from the previous round
    if (state.phase === "results") {
      await this.prepareNextRound();
      events.push({
        type: "game:roundStart",
        roundNumber: state.roundNumber,
      });
    }

    // Place bet and set player as active, clear skip status
    state.bets[playerId] = amount;
    delete state.skippedPlayers[playerId];
    player.status = "active";
    player.connectionState = "connected";

    // Deduct bet from bankroll immediately
    player.bankroll -= amount;

    events.push({
      type: "game:betPlaced",
      playerId,
      amount,
    });

    // Check if all players have either bet or skipped
    const allPlayersReady = Object.keys(this.room.players).every(
      (pid) => state.bets[pid] !== undefined || state.skippedPlayers[pid]
    );

    // Need at least one player betting to deal
    const anyPlayerBetting = Object.keys(state.bets).length > 0;

    if (allPlayersReady && anyPlayerBetting) {
      // Deal cards
      const dealEvents = await this.dealInitialCards();
      events.push(...dealEvents);
    }

    await RoomManager.updateRoom(this.room);

    return events;
  }

  /**
   * Skip this round (sit out)
   */
  async skipRound(playerId: string): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState;

    if (!state || (state.phase !== "betting" && state.phase !== "results")) {
      throw new Error("Not in betting phase");
    }

    const player = this.room.players[playerId];
    if (!player) {
      throw new Error("Player not found");
    }

    // If we're in results phase, transition to betting phase first
    // This clears old bets and hands from the previous round
    if (state.phase === "results") {
      await this.prepareNextRound();
      events.push({
        type: "game:roundStart",
        roundNumber: state.roundNumber,
      });
    }

    // Mark player as skipping, remove any bet
    state.skippedPlayers[playerId] = true;
    delete state.bets[playerId];
    player.status = "waiting";

    // Check if all players have either bet or skipped
    const allPlayersReady = Object.keys(this.room.players).every(
      (pid) => state.bets[pid] !== undefined || state.skippedPlayers[pid]
    );

    // Need at least one player betting to deal
    const anyPlayerBetting = Object.keys(state.bets).length > 0;

    if (allPlayersReady && anyPlayerBetting) {
      // Deal cards
      const dealEvents = await this.dealInitialCards();
      events.push(...dealEvents);
    }

    await RoomManager.updateRoom(this.room);

    return events;
  }

  /**
   * Deal initial cards to all players and dealer
   */
  private async dealInitialCards(): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState!;

    state.phase = "dealing";

    // Deal two cards to each player
    for (const playerId of Object.keys(this.room.players)) {
      const card1 = dealCard(state.shoe);
      const card2 = dealCard(state.shoe);

      if (!card1 || !card2) {
        throw new Error("Not enough cards in shoe");
      }

      const hand = createHand([card1, card2]);
      hand.bet = state.bets[playerId];
      state.playerHandsMap[playerId] = [hand];

      // Update running count
      state.runningCount += this.getHiLoValue(card1) + this.getHiLoValue(card2);
    }

    // Deal two cards to dealer
    const dealerCard1 = dealCard(state.shoe);
    const dealerCard2 = dealCard(state.shoe);

    if (!dealerCard1 || !dealerCard2) {
      throw new Error("Not enough cards in shoe");
    }

    state.dealerHand = createHand([dealerCard1, dealerCard2]);
    state.dealerHoleCardRevealed = false;

    // Update running count (only first card is visible)
    state.runningCount += this.getHiLoValue(dealerCard1);

    // Calculate true count
    const remainingDecks = state.shoe.length / 52;
    state.trueCount =
      remainingDecks > 0 ? Math.round(state.runningCount / remainingDecks) : 0;

    events.push({
      type: "game:dealing",
      hands: state.playerHandsMap,
      dealerHand: state.dealerHand,
    });

    // Check for naturals
    const dealerHasBlackjack = state.dealerHand.isBlackjack;
    const anyPlayerBlackjack = Object.values(state.playerHandsMap).some(
      (hands) => hands[0].isBlackjack
    );

    if (dealerHasBlackjack || anyPlayerBlackjack) {
      // Reveal dealer's hole card
      state.dealerHoleCardRevealed = true;

      if (dealerHasBlackjack) {
        // Dealer blackjack - settle immediately
        await this.settleRound();
        const settleEvents = await this.createSettlementEvents();
        events.push(...settleEvents);
      } else {
        // Only players have blackjack - start normal play (will skip blackjack hands)
        const hasPlayerToPlay = await this.startFirstPlayerTurn();
        
        if (hasPlayerToPlay) {
          events.push({
            type: "game:turnStart",
            playerId: state.currentPlayerId!,
            handIndex: 0,
            timeoutAt: state.turnTimeoutAt!,
          });
        } else {
          // All players have blackjack - go directly to dealer turn and settlement
          await this.playDealerTurn();
          events.push({
            type: "game:dealerTurn",
            dealerHand: state.dealerHand,
          });
          
          await this.settleRound();
          const settleEvents = await this.createSettlementEvents();
          events.push(...settleEvents);
        }
      }
    } else {
      // Normal play
      const hasPlayerToPlay = await this.startFirstPlayerTurn();
      
      if (hasPlayerToPlay) {
        events.push({
          type: "game:turnStart",
          playerId: state.currentPlayerId!,
          handIndex: 0,
          timeoutAt: state.turnTimeoutAt!,
        });
      } else {
        // Edge case: no valid player to play (shouldn't happen in normal play)
        await this.playDealerTurn();
        events.push({
          type: "game:dealerTurn",
          dealerHand: state.dealerHand,
        });
        
        await this.settleRound();
        const settleEvents = await this.createSettlementEvents();
        events.push(...settleEvents);
      }
    }

    await RoomManager.updateRoom(this.room);

    return events;
  }


  /**
   * Start the first player's turn
   * Returns true if there's a player to play, false if all were skipped (e.g., all have blackjack)
   */
  private async startFirstPlayerTurn(): Promise<boolean> {
    const state = this.room.gameState!;
    state.phase = "playerTurn";

    // Get first player by seat number
    const turnOrder = this.getTurnOrder();
    if (turnOrder.length === 0) {
      throw new Error("No players in game");
    }

    state.currentPlayerId = turnOrder[0];
    state.currentHandIndex = 0;

    // Skip players with blackjack
    while (state.currentPlayerId) {
      const currentHand = state.playerHandsMap[state.currentPlayerId][state.currentHandIndex];
      if (!currentHand.isBlackjack) {
        break;
      }
      await this.advanceTurn();
    }

    if (state.currentPlayerId) {
      state.turnStartTime = Date.now();
      state.turnTimeoutAt =
        Date.now() + this.room.settings.turnTimeoutSeconds * 1000;
      return true;
    }
    
    // All players were skipped (all have blackjack)
    return false;
  }


  /**
   * Get turn order by seat number
   * Includes all players who have placed bets, regardless of connection status
   */
  private getTurnOrder(): string[] {
    const state = this.room.gameState;
    // Include players who have placed bets OR are not disconnected
    return Object.values(this.room.players)
      .filter((p) => 
        (state && state.bets[p.playerId] !== undefined) || 
        p.status !== "disconnected"
      )
      .sort((a, b) => a.seatNumber - b.seatNumber)
      .map((p) => p.playerId);
  }

  /**
   * Process a player action
   */
  async processAction(
    playerId: string,
    action: Action
  ): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState!;

    if (state.phase !== "playerTurn") {
      throw new Error("Not player's turn");
    }

    if (state.currentPlayerId !== playerId) {
      throw new Error("Not your turn");
    }

    const hand = state.playerHandsMap[playerId][state.currentHandIndex];
    if (!hand) {
      throw new Error("Hand not found");
    }

    // Record decision for review
    await this.recordDecision(playerId, action, hand);

    // Execute action
    switch (action) {
      case "hit":
        await this.executeHit(playerId);
        break;
      case "stand":
        await this.executeStand(playerId);
        break;
      case "double":
        await this.executeDouble(playerId);
        break;
      case "split":
        await this.executeSplit(playerId);
        break;
      case "surrender":
        await this.executeSurrender(playerId);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    events.push({
      type: "game:action",
      playerId,
      handIndex: state.currentHandIndex,
      action,
      updatedHand: state.playerHandsMap[playerId][state.currentHandIndex],
    });

    // Check if turn is complete
    const currentHand = state.playerHandsMap[playerId][state.currentHandIndex];
    if (currentHand.isComplete) {
      await this.advanceTurn();

      if (state.currentPlayerId) {
        // Next player's turn
        events.push({
          type: "game:turnStart",
          playerId: state.currentPlayerId,
          handIndex: state.currentHandIndex,
          timeoutAt: state.turnTimeoutAt!,
        });
      } else {
        // All players done - dealer turn
        await this.playDealerTurn();
        events.push({
          type: "game:dealerTurn",
          dealerHand: state.dealerHand,
        });

        // Settle round
        await this.settleRound();
        const settleEvents = await this.createSettlementEvents();
        events.push(...settleEvents);
      }
    }

    await RoomManager.updateRoom(this.room);

    return events;
  }

  /**
   * Execute hit action
   */
  private async executeHit(playerId: string): Promise<void> {
    const state = this.room.gameState!;
    const hand = state.playerHandsMap[playerId][state.currentHandIndex];

    const card = dealCard(state.shoe);
    if (!card) {
      throw new Error("No cards left in shoe");
    }

    hand.cards.push(card);
    const total = calculateTotal(hand.cards);
    hand.total = total.total;
    hand.isSoft = total.isSoft;
    hand.isBusted = total.total > 21;

    // Update running count
    state.runningCount += this.getHiLoValue(card);

    if (hand.isBusted) {
      hand.isComplete = true;
    }
  }

  /**
   * Execute stand action
   */
  private async executeStand(playerId: string): Promise<void> {
    const state = this.room.gameState!;
    const hand = state.playerHandsMap[playerId][state.currentHandIndex];
    hand.isComplete = true;
  }

  /**
   * Execute double action
   */
  private async executeDouble(playerId: string): Promise<void> {
    const state = this.room.gameState!;
    const hand = state.playerHandsMap[playerId][state.currentHandIndex];
    const player = this.room.players[playerId];

    // Double the bet
    if (player.bankroll < hand.bet) {
      throw new Error("Insufficient funds to double");
    }

    player.bankroll -= hand.bet;
    hand.bet *= 2;

    // Hit once
    await this.executeHit(playerId);

    // Stand
    hand.isComplete = true;
  }

  /**
   * Execute split action
   */
  private async executeSplit(playerId: string): Promise<void> {
    const state = this.room.gameState!;
    const hand = state.playerHandsMap[playerId][state.currentHandIndex];
    const player = this.room.players[playerId];

    if (!hand.isPair) {
      throw new Error("Can only split pairs");
    }

    if (player.bankroll < hand.bet) {
      throw new Error("Insufficient funds to split");
    }

    // Deduct bet for second hand
    player.bankroll -= hand.bet;

    // Split into two hands
    const card1 = hand.cards[0];
    const card2 = hand.cards[1];

    // First hand
    const newCard1 = dealCard(state.shoe)!;
    hand.cards = [card1, newCard1];
    hand.isFromSplit = true;
    hand.isPair = false;
    const total1 = calculateTotal(hand.cards);
    hand.total = total1.total;
    hand.isSoft = total1.isSoft;

    // Second hand
    const newCard2 = dealCard(state.shoe)!;
    const splitHand = createHand([card2, newCard2]);
    splitHand.bet = hand.bet;
    splitHand.isFromSplit = true;
    const total2 = calculateTotal(splitHand.cards);
    splitHand.total = total2.total;
    splitHand.isSoft = total2.isSoft;

    // Insert second hand after current
    state.playerHandsMap[playerId].splice(
      state.currentHandIndex + 1,
      0,
      splitHand
    );

    // Update running count
    state.runningCount += this.getHiLoValue(newCard1) + this.getHiLoValue(newCard2);

    // If split aces, both hands complete immediately (casino rule)
    if (card1.rank === "A" && this.room.settings.rules.acesSplitOneCard) {
      hand.isComplete = true;
      splitHand.isComplete = true;
    }
  }

  /**
   * Execute surrender action
   */
  private async executeSurrender(playerId: string): Promise<void> {
    const state = this.room.gameState!;
    const hand = state.playerHandsMap[playerId][state.currentHandIndex];

    hand.isSurrendered = true;
    hand.isComplete = true;
  }

  /**
   * Advance to next turn
   */
  private async advanceTurn(): Promise<void> {
    const state = this.room.gameState!;
    const currentPlayerId = state.currentPlayerId!;
    const currentHands = state.playerHandsMap[currentPlayerId];

    // Check if there's another hand for current player
    if (state.currentHandIndex + 1 < currentHands.length) {
      state.currentHandIndex++;

      // Skip if this hand is blackjack
      while (state.currentHandIndex < currentHands.length &&
             currentHands[state.currentHandIndex].isBlackjack) {
        state.currentHandIndex++;
      }

      if (state.currentHandIndex < currentHands.length) {
        state.turnStartTime = Date.now();
        state.turnTimeoutAt =
          Date.now() + this.room.settings.turnTimeoutSeconds * 1000;
        return;
      }
    }

    // Move to next player
    const turnOrder = this.getTurnOrder();
    const currentIndex = turnOrder.indexOf(currentPlayerId);
    let nextIndex = currentIndex + 1;

    // Find next player without blackjack
    while (nextIndex < turnOrder.length) {
      const nextPlayerId = turnOrder[nextIndex];
      const nextHands = state.playerHandsMap[nextPlayerId];

      // Check if this player has any non-blackjack hands
      const hasNonBlackjackHand = nextHands.some(hand => !hand.isBlackjack);

      if (hasNonBlackjackHand) {
        state.currentPlayerId = nextPlayerId;
        state.currentHandIndex = 0;

        // Find first non-blackjack hand
        while (state.currentHandIndex < nextHands.length &&
               nextHands[state.currentHandIndex].isBlackjack) {
          state.currentHandIndex++;
        }

        state.turnStartTime = Date.now();
        state.turnTimeoutAt =
          Date.now() + this.room.settings.turnTimeoutSeconds * 1000;
        return;
      }

      nextIndex++;
    }

    // All players done
    state.currentPlayerId = null;
    state.currentHandIndex = 0;
    state.turnStartTime = null;
    state.turnTimeoutAt = null;
  }

  /**
   * Play dealer's turn
   */
  private async playDealerTurn(): Promise<void> {
    const state = this.room.gameState!;
    state.phase = "dealerTurn";
    state.dealerHoleCardRevealed = true;

    // Update running count with hole card
    state.runningCount += this.getHiLoValue(state.dealerHand.cards[1]);

    const dealerRule = this.room.settings.rules.dealerRule;

    while (true) {
      const total = state.dealerHand.total;
      const isSoft = state.dealerHand.isSoft;

      // Dealer stands on 17+ (or soft 17 if S17)
      if (total > 17) break;
      if (total === 17 && (dealerRule === "S17" || !isSoft)) break;

      // Hit
      const card = dealCard(state.shoe);
      if (!card) break;

      state.dealerHand.cards.push(card);
      const newTotal = calculateTotal(state.dealerHand.cards);
      state.dealerHand.total = newTotal.total;
      state.dealerHand.isSoft = newTotal.isSoft;
      state.dealerHand.isBusted = newTotal.total > 21;

      // Update running count
      state.runningCount += this.getHiLoValue(card);

      if (state.dealerHand.isBusted) break;
    }
  }

  /**
   * Settle the round and calculate payouts
   */
  private async settleRound(): Promise<void> {
    const state = this.room.gameState!;
    state.phase = "settlement";

    const dealerTotal = state.dealerHand.total;
    const dealerBusted = state.dealerHand.isBusted;
    const dealerBlackjack = state.dealerHand.isBlackjack;
    const payoutMultiplier =
      this.room.settings.rules.blackjackPayout === "3:2" ? 1.5 : 1.2;

    for (const [playerId, hands] of Object.entries(state.playerHandsMap)) {
      const player = this.room.players[playerId];
      let totalPayout = 0;

      for (const hand of hands) {
        if (hand.isSurrendered) {
          // Surrender: get half bet back
          totalPayout += hand.bet * 0.5;
        } else if (hand.isBlackjack && !dealerBlackjack) {
          // Player blackjack (and dealer doesn't have blackjack)
          totalPayout += hand.bet * (1 + payoutMultiplier);
        } else if (hand.isBusted) {
          // Player busted: lose bet
          totalPayout += 0;
        } else if (dealerBusted) {
          // Dealer busted: player wins
          totalPayout += hand.bet * 2;
        } else if (hand.total > dealerTotal) {
          // Player wins
          totalPayout += hand.bet * 2;
        } else if (hand.total === dealerTotal) {
          // Push: return bet
          totalPayout += hand.bet;
        } else {
          // Dealer wins: lose bet
          totalPayout += 0;
        }
      }

      player.bankroll += totalPayout;
    }
  }

  /**
   * Create settlement events and prepare for next round
   */
  private async createSettlementEvents(): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState!;

    const results: Record<string, RoundResult[]> = {};
    const payouts: Record<string, number> = {};
    const updatedBankrolls: Record<string, number> = {};

    // Calculate results for each player
    for (const [playerId, hands] of Object.entries(state.playerHandsMap)) {
      const player = this.room.players[playerId];
      results[playerId] = [];
      payouts[playerId] = 0;
      
      for (const hand of hands) {
        let result: RoundResult;
        if (hand.isSurrendered) {
          result = "surrender";
          payouts[playerId] += hand.bet * 0.5;
        } else if (hand.isBusted) {
          result = "lose";
        } else if (hand.isBlackjack && !state.dealerHand.isBlackjack) {
          result = "blackjack";
        } else if (state.dealerHand.isBusted) {
          result = "win";
        } else if (hand.total > state.dealerHand.total) {
          result = "win";
        } else if (hand.total === state.dealerHand.total) {
          result = "push";
        } else {
          result = "lose";
        }
        results[playerId].push(result);
      }
      
      updatedBankrolls[playerId] = player.bankroll;
    }

    events.push({
      type: "game:roundEnd",
      results,
      payouts,
      updatedBankrolls,
    });

    // Store results and go to results phase (don't auto-start next round)
    state.roundResults = results;
    state.phase = "results";
    
    // Save previous round data for display during betting
    state.previousRound = {
      dealerHand: { ...state.dealerHand },
      playerHandsMap: { ...state.playerHandsMap },
      results: results,
    };

    await RoomManager.updateRoom(this.room);

    return events;
  }

  /**
   * Start the next betting round (called when first bet/skip is placed after results)
   * This clears the previous round cards
   */
  private async prepareNextRound(): Promise<void> {
    const state = this.room.gameState!;

    // Check if shoe needs reshuffling (penetration > 75%)
    const totalCards = this.room.settings.rules.decks * 52;
    const usedCards = totalCards - state.shoe.length;
    const penetration = usedCards / totalCards;

    if (penetration > 0.75) {
      // Reshuffle
      state.shoe = createShoe(this.room.settings.rules.decks);
      state.runningCount = 0;
      state.trueCount = 0;
    }

    // Increment round number
    state.roundNumber++;

    // Reset for new betting phase
    state.phase = "betting";
    state.bets = {};
    state.skippedPlayers = {};
    state.roundResults = {};
    state.playerHandsMap = {};
    state.dealerHand = createHand([]);
    state.dealerHoleCardRevealed = false;
    state.currentPlayerId = null;
    state.currentHandIndex = 0;
    state.turnStartTime = null;
    state.turnTimeoutAt = null;

    // Reset player statuses
    for (const player of Object.values(this.room.players)) {
      if (player.status !== "disconnected") {
        player.status = "waiting";
      }
    }

    await RoomManager.updateRoom(this.room);
  }

  /**
   * Transition from results to betting phase (for UI clarity)
   * Called when host or system wants to clear results and start fresh betting
   */
  async startNextRoundBetting(): Promise<MultiplayerEvent[]> {
    const events: MultiplayerEvent[] = [];
    const state = this.room.gameState;

    if (!state || state.phase !== "results") {
      throw new Error("Not in results phase");
    }

    await this.prepareNextRound();

    events.push({
      type: "game:roundStart",
      roundNumber: state.roundNumber,
    });

    return events;
  }

  /**
   * Record decision for post-game review
   */
  private async recordDecision(
    playerId: string,
    action: Action,
    hand: Hand
  ): Promise<void> {
    if (!this.history) return;

    const state = this.room.gameState!;
    const dealerUpcard = state.dealerHand.cards[0];

    // Get recommended action
    const context: StrategyContext = {
      hand,
      dealerUpcard,
      canDouble: hand.cards.length === 2 && !hand.isFromSplit,
      canSplit: hand.isPair && hand.cards.length === 2,
      canSurrender:
        this.room.settings.rules.lateSurrender && hand.cards.length === 2,
      isAfterSplit: hand.isFromSplit,
    };

    const recommendation = recommendAction(context, this.room.settings.rules);

    const decision: DecisionHistory = {
      timestamp: Date.now(),
      handState: [...hand.cards],
      dealerUpcard,
      action,
      recommendedAction: recommendation.bestAction,
      isCorrect: action === recommendation.bestAction,
      timeToDecide: Date.now() - (state.turnStartTime || Date.now()),
    };

    // Save to history (will implement later)
    // This requires round tracking
  }

  /**
   * Calculate Hi-Lo card value
   */
  private getHiLoValue(card: Card): number {
    const rank = card.rank;
    if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
    if (["7", "8", "9"].includes(rank)) return 0;
    return -1; // 10, J, Q, K, A
  }

  /**
   * End the session
   */
  async endSession(): Promise<void> {
    if (this.history) {
      this.history.endTime = Date.now();
      await RoomManager.saveHistory(this.history);
    }

    this.room.state = "review";
    await RoomManager.updateRoom(this.room);
  }
}
