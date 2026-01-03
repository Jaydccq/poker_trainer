'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Action, 
  Card, 
  GamePhase, 
  GameRules, 
  GameState, 
  Hand, 
  RoundResult,
  StrategyRecommendation 
} from '@/types';
import { createShoe, dealCard } from '@/utils/deck';
import { createHand, calculateTotal, getHandType } from '@/utils/hand';
import { recommendAction, StrategyContext } from '@/utils/strategy';

// Default rules matching requirements
const DEFAULT_RULES: GameRules = {
  decks: 6,
  dealerRule: 'S17',
  blackjackPayout: '3:2',
  doubleAnyTwoCards: true,
  doubleAfterSplit: true,
  acesSplitOneCard: true,
  lateSurrender: true,
  insuranceEnabled: true,
};

function createInitialState(rules: GameRules): GameState {
  const shoe = createShoe(rules.decks, rules.seed);
  return {
    shoe,
    playerHands: [],
    currentHandIndex: 0,
    dealerHand: createHand([]),
    dealerHoleCardRevealed: false,
    phase: 'betting',
    result: [],
    chipBalance: 1000,
    currentBet: 0,
    runningCount: 0,
    trueCount: 0,
  };
}

export interface PendingFeedback {
  isCorrect: boolean;
  chosenAction: Action;
  recommendation: StrategyRecommendation;
  handType: string;
  handKey: string;
  dealerUpcard: Card;
}

export function useGame(initialRules: GameRules = DEFAULT_RULES, mode: 'free' | 'training' = 'free') {
  // Override initial chips based on mode
  const initialState = createInitialState(initialRules);
  if (mode === 'training') {
    initialState.chipBalance = 1000;
  } else {
    initialState.chipBalance = 0; // Infinite/irrelevant
  }

  const [rules, setRules] = useState<GameRules>(initialRules);
  const [state, setState] = useState<GameState>(initialState);
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null);
  const [shouldPlayDealer, setShouldPlayDealer] = useState(false);
  
  const currentHand = useMemo(() => 
    state.playerHands[state.currentHandIndex] || null,
    [state.playerHands, state.currentHandIndex]
  );
  
  // Dealer's face-up card (second card dealt)
  const dealerUpcard = useMemo(() => 
    state.dealerHand.cards[1] || null,
    [state.dealerHand]
  );
  
  const availableActions = useMemo(() => {
    if (!currentHand || state.phase !== 'playerTurn') {
      return {
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        canInsurance: false,
      };
    }
    
    const isFirstAction = currentHand.cards.length === 2 && !currentHand.isComplete;
    
    // Check balance for Double/Split in Training Mode
    const canAffordBet = mode === 'free' || state.chipBalance >= currentHand.bet;

    return {
      canHit: !currentHand.isComplete && !currentHand.isBusted,
      canStand: !currentHand.isComplete,
      canDouble: isFirstAction && rules.doubleAnyTwoCards && 
                 (rules.doubleAfterSplit || !currentHand.isFromSplit) && canAffordBet,
      canSplit: isFirstAction && currentHand.isPair && canAffordBet,
      canSurrender: isFirstAction && rules.lateSurrender && !currentHand.isFromSplit,
      canInsurance: false,
    };
  }, [currentHand, state.phase, state.playerHands.length, rules, state.chipBalance, mode]);
  
  // Deal a new hand
  const dealNewHand = useCallback(() => {
    setState(prev => {
      // Logic for shuffling
      let shoe = prev.shoe;
      const totalCards = rules.decks * 52;
      const shouldReshuffle = shoe.length < totalCards * 0.25;
      
      let runningCount = prev.runningCount; // Carry over
      
      if (shouldReshuffle) {
        shoe = createShoe(rules.decks, rules.seed);
        runningCount = 0; // Reset count
      }
      
      // Helper to deal and count
      const dealAndCount = () => {
        const card = dealCard(shoe)!;
        runningCount += getHiLoValue(card);
        return card;
      };

      const playerCard1 = dealAndCount();
      const dealerCard1 = dealAndCount();
      const playerCard2 = dealAndCount();
      const dealerCard2 = dealAndCount();
      
      const playerHand = createHand([playerCard1, playerCard2]);
      playerHand.bet = prev.currentBet; // Assign the current bet to this hand

      const dealerHand = createHand([dealerCard1, dealerCard2]);
      
      let phase: GamePhase = 'playerTurn';
      let result: RoundResult[] = [];
      let balance = prev.chipBalance;
      
      // Handle Blackjack immediately
      if (playerHand.isBlackjack || dealerHand.isBlackjack) {
        phase = 'settlement';
        dealerHand.cards[0] = dealerHand.cards[0]; // Logic placeholder (reveal logic is in view/render mainly)
        
        let payout = 0;
        
        if (playerHand.isBlackjack && dealerHand.isBlackjack) {
           result = ['push'];
           payout = playerHand.bet; // Return bet
        } else if (playerHand.isBlackjack) {
           result = ['blackjack'];
           // 3:2 payout
           payout = playerHand.bet + (playerHand.bet * 1.5);
        } else {
           result = ['lose'];
           payout = 0;
        }

        if (mode === 'training') {
           balance += payout;
        }
      }
      
      const remainingDecks = Math.max(0.5, shoe.length / 52);
      const trueCount = Math.round(runningCount / remainingDecks);

      return {
        ...prev,
        shoe,
        playerHands: [playerHand],
        currentHandIndex: 0,
        dealerHand,
        dealerHoleCardRevealed: phase === 'settlement',
        phase,
        result,
        runningCount,
        trueCount,
        chipBalance: balance
      };
    });
    
    setPendingFeedback(null);
    setShouldPlayDealer(false);
  }, [rules, mode]);

  const placeBet = useCallback((amount: number) => {
    setState(prev => {
      if (prev.phase !== 'betting') return prev;
      const newBet = prev.currentBet + amount;
      if (newBet > prev.chipBalance) return prev; 
      return {
        ...prev,
        currentBet: newBet,
        chipBalance: prev.chipBalance - amount
      };
    });
  }, []);

  const clearBet = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'betting') return prev;
      return {
        ...prev,
        chipBalance: prev.chipBalance + prev.currentBet,
        currentBet: 0
      };
    });
  }, []);

  // Reset to betting phase (training mode) - keeps current shoe and counts
  // Auto-refill chips if balance is too low
  const resetToBetting = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'settlement') return prev;
      
      // Check if balance is below minimum bet (15) - need to refill
      const needsRefill = prev.chipBalance < 15;
      const newBalance = needsRefill ? 1000 : prev.chipBalance;
      
      return {
        ...prev,
        playerHands: [],
        currentHandIndex: 0,
        dealerHand: createHand([]),
        dealerHoleCardRevealed: false,
        phase: 'betting',
        result: [],
        currentBet: 0,
        chipBalance: newBalance,
        // Keep shoe, runningCount, trueCount
        // Flag for UI to show refill message
        justRefilled: needsRefill,
      };
    });
  }, []);
  
  // Handle player action
  const handleAction = useCallback((action: Action) => {
    if (!currentHand || !dealerUpcard) return;
    
    const context: StrategyContext = {
      hand: currentHand,
      dealerUpcard,
      canDouble: availableActions.canDouble,
      canSplit: availableActions.canSplit,
      canSurrender: availableActions.canSurrender,
      isAfterSplit: currentHand.isFromSplit,
    };
    
    const recommendation = recommendAction(context, rules);
    const isCorrect = action === recommendation.bestAction;
    
    setPendingFeedback({
      isCorrect,
      chosenAction: action,
      recommendation,
      handType: getHandType(currentHand.cards),
      handKey: getHandKeyFromHand(currentHand),
      dealerUpcard,
    });
  }, [currentHand, dealerUpcard, availableActions, rules]);
  
  // Execute action
  const executeAction = useCallback((action: Action) => {
    setState(prev => {
      const handIndex = prev.currentHandIndex;
      const hand = prev.playerHands[handIndex];
      if (!hand) return prev;
      
      let newHands = [...prev.playerHands];
      let shoe = [...prev.shoe];
      let newHandIndex = handIndex;
      let newRunningCount = prev.runningCount;
      let balance = prev.chipBalance;

      // Helper for dealing with count
      const dealOne = () => {
          const c = dealCard(shoe)!;
          newRunningCount += getHiLoValue(c);
          return c;
      };
      
      switch (action) {
        case 'hit': {
          const newCard = dealOne();
          const updatedCards = [...hand.cards, newCard];
          const updatedHand = createHand(updatedCards, hand.isFromSplit);
          updatedHand.bet = hand.bet;
          
          if (updatedHand.isBusted || updatedHand.total === 21) {
            updatedHand.isComplete = true;
          }
          
          newHands[handIndex] = updatedHand;
          break;
        }
        
        case 'stand': {
          newHands[handIndex] = { ...hand, isComplete: true };
          break;
        }
        
        case 'double': {
          const newCard = dealOne();
          const updatedCards = [...hand.cards, newCard];
          const updatedHand = createHand(updatedCards, hand.isFromSplit);
          updatedHand.isComplete = true;
          
          if (mode === 'training') {
              balance -= hand.bet;
          }
          updatedHand.bet = hand.bet * 2;
          
          newHands[handIndex] = updatedHand;
          break;
        }
        
        case 'split': {
          const card1 = hand.cards[0];
          const card2 = hand.cards[1];
          const newCard1 = dealOne();
          const newCard2 = dealOne();
          
          const hand1 = createHand([card1, newCard1], true);
          hand1.bet = hand.bet; // Original bet

          const hand2 = createHand([card2, newCard2], true);
          hand2.bet = hand.bet; // Second bet matched
          
          if (mode === 'training') {
              balance -= hand.bet;
          }
          
          if (card1.rank === 'A' && rules.acesSplitOneCard) {
            hand1.isComplete = true;
            hand2.isComplete = true;
          }
          
          newHands = [
            ...newHands.slice(0, handIndex),
            hand1,
            hand2,
            ...newHands.slice(handIndex + 1)
          ];
          break;
        }
        
        case 'surrender': {
            // Return half bet
            if (mode === 'training') {
                balance += (hand.bet * 0.5);
            }
            newHands[handIndex] = { ...hand, isComplete: true };
          break;
        }
        
        case 'insurance': {
          break;
        }
      }
      
      let allComplete = newHands.every(h => h.isComplete || h.isBusted);
      let newPhase = prev.phase;
      
      if (allComplete) {
        newPhase = 'dealerTurn';
      } else {
        for (let i = 0; i < newHands.length; i++) {
          if (!newHands[i].isComplete && !newHands[i].isBusted) {
            newHandIndex = i;
            break;
          }
        }
      }
      
      const remainingDecks = Math.max(0.5, shoe.length / 52);
      const trueCount = Math.round(newRunningCount / remainingDecks);

      return {
        ...prev,
        shoe,
        playerHands: newHands,
        currentHandIndex: newHandIndex,
        phase: newPhase,
        runningCount: newRunningCount,
        trueCount,
        chipBalance: balance
      };
    });
    
    setPendingFeedback(null);
  }, [rules, mode]);
  
  const handleFeedbackContinue = useCallback((useRecommended: boolean) => {
    if (!pendingFeedback) return;
    const action = useRecommended ? pendingFeedback.recommendation.bestAction : pendingFeedback.chosenAction;
    executeAction(action);
  }, [pendingFeedback, executeAction]);
  
  const playDealerTurn = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'dealerTurn') return prev;
      
      let shoe = [...prev.shoe];
      let dealerCards = [...prev.dealerHand.cards];
      let newRunningCount = prev.runningCount;

      const dealOne = () => {
          const c = dealCard(shoe)!;
          newRunningCount += getHiLoValue(c);
          return c;
      };

      // Reveal hole card (in logic, we just continue)
      // Actually we need to count the hole card now? 
      // The hole card was dealt but not counted in Running Count?
      // In `dealNewHand`, we dealt 4 cards and counted them all.
      // So dealer's hole card WAS counted.
      // So no need to count it again.
      
      const allBusted = prev.playerHands.every(h => h.isBusted);
      
      if (!allBusted) {
        const shouldHitDealer = () => {
          const { total, isSoft } = calculateTotal(dealerCards);
          if (total < 17) return true;
          if (total === 17 && isSoft && rules.dealerRule === 'H17') return true;
          return false;
        };
        
        while (shouldHitDealer()) {
          dealerCards.push(dealOne());
        }
      }
      
      const dealerHand = createHand(dealerCards);
      let balance = prev.chipBalance;
      
      const results: RoundResult[] = prev.playerHands.map((hand) => {
        if (hand.isComplete && hand.cards.length === 2 && !hand.isBusted && hand.total < 21) {
             // Surrender logic handled in executeAction actually. 
             // But result array needs 'surrender' entry?
             // Not really, surrender stops the hand.
             // If surrender was chosen, isBusted is false, but hand is complete.
             // But surrender action immediately set isComplete.
             // We need to return specific 'surrender' status if we want to show it.
        }
        
        // Payout logic
        if (hand.isBusted) return 'lose';
        if (dealerHand.isBusted) {
            if (mode === 'training') balance += (hand.bet * 2);
            return 'win';
        }
        if (hand.isBlackjack && !dealerHand.isBlackjack) {
            // Already handled? No, BJ logic in dealNewHand handled INITIAL BJ.
            // If player got BJ after split? Standard BJ doesn't happen after split usually (rules dependent).
            // Assuming 3:2 only for natural.
            // If just 21, it wins 1:1.
            if (mode === 'training') balance += (hand.bet * 2);
            return 'win'; // Or blackjack if logic allows
        }
        if (dealerHand.isBlackjack && !hand.isBlackjack) return 'lose';
        
        if (hand.total > dealerHand.total) {
            if (mode === 'training') balance += (hand.bet * 2);
            return 'win';
        }
        if (hand.total < dealerHand.total) return 'lose';
        
        if (mode === 'training') balance += hand.bet; // Push return
        return 'push';
      });
      
      const remainingDecks = Math.max(0.5, shoe.length / 52);
      const trueCount = Math.round(newRunningCount / remainingDecks);

      return {
        ...prev,
        shoe,
        dealerHand,
        dealerHoleCardRevealed: true,
        phase: 'settlement',
        result: results,
        runningCount: newRunningCount,
        trueCount,
        chipBalance: balance
      };
    });
  }, [rules, mode]);
  
  useEffect(() => {
    if (state.phase === 'dealerTurn' && !pendingFeedback) {
      const timer = setTimeout(playDealerTurn, 600);
      return () => clearTimeout(timer);
    }
  }, [state.phase, pendingFeedback, playDealerTurn]);
  
  const updateRules = useCallback((newRules: Partial<GameRules>) => {
    setRules(prev => ({ ...prev, ...newRules }));
  }, []);
  
  return {
    state,
    rules,
    currentHand,
    dealerUpcard,
    pendingFeedback,
    availableActions,
    dealNewHand,
    handleAction,
    handleFeedbackContinue,
    updateRules,
    placeBet,
    clearBet,
    resetToBetting,
  };
}

function getHiLoValue(card: Card): number {
  if (['2', '3', '4', '5', '6'].includes(card.rank)) return 1;
  if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) return -1;
  return 0;
}

function getHandKeyFromHand(hand: Hand): string {
  const cards = hand.cards;
  if (cards.length !== 2) return `HARD_${hand.total}`;
  if (hand.isPair) {
    const rank = cards[0].rank;
    const pairValue = ['10', 'J', 'Q', 'K'].includes(rank) ? '10' : rank;
    return `PAIR_${pairValue}${pairValue}`;
  }
  if (hand.isSoft) {
    const nonAce = cards.find(c => c.rank !== 'A');
    return `SOFT_A${nonAce?.rank || ''}`;
  }
  return `HARD_${hand.total}`;
}
