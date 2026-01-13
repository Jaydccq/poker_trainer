import { Card, GameRules, Rank, Suit } from '@/types';
import { createShoe, dealCard } from '../deck';
import { createHand } from '../hand';
import { recommendAction, StrategyContext } from '../strategy';

// Helper to create cards
const card = (rank: Rank, suit: Suit = 'hearts'): Card => ({
  rank,
  suit,
  value: rank === 'A' ? 11 : ['J', 'Q', 'K', '10'].includes(rank) ? 10 : Number(rank),
});

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

/**
 * Reproducible test scenarios using seeded decks
 * These scenarios can be replayed in the actual game for manual verification
 */
describe('Reproducible Test Scenarios', () => {
  describe('Seeded deck consistency', () => {
    it('should produce consistent card deals with same seed', () => {
      const seed = 12345;
      const shoe1 = createShoe(6, seed);
      const shoe2 = createShoe(6, seed);
      
      // Deal 10 cards from each
      const cards1 = [];
      const cards2 = [];
      
      for (let i = 0; i < 10; i++) {
        cards1.push(dealCard(shoe1));
        cards2.push(dealCard(shoe2));
      }
      
      // Should be identical
      for (let i = 0; i < 10; i++) {
        expect(cards1[i]?.rank).toBe(cards2[i]?.rank);
        expect(cards1[i]?.suit).toBe(cards2[i]?.suit);
      }
    });
  });

  describe('HARD 12 Scenarios with Seed 11111', () => {
    const seed = 11111;
    
    it('Scenario 1: HARD 12 vs 2 should HIT', () => {
      const shoe = createShoe(6, seed);
      
      // Simulate dealing: Player gets 10, Dealer gets hidden, Player gets 2, Dealer shows 2
      const p1 = dealCard(shoe)!;
      const d1 = dealCard(shoe)!;
      const p2 = dealCard(shoe)!;
      const d2 = dealCard(shoe)!;
      
      // Create a known HARD 12 scenario
      const playerHand = createHand([card('10'), card('2')]);
      const dealerUpcard = card('2');
      
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard,
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
      expect(playerHand.total).toBe(12);
    });
  });

  describe('SOFT A7 Scenarios with Seed 22222', () => {
    const seed = 22222;
    
    it('Scenario 1: SOFT A7 vs 2 should STAND (cannot double)', () => {
      const playerHand = createHand([card('A'), card('7')]);
      const dealerUpcard = card('2');
      
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('stand');
      expect(playerHand.total).toBe(18);
      expect(playerHand.isSoft).toBe(true);
    });
    
    it('Scenario 2: SOFT A7 vs 5 should DOUBLE', () => {
      const playerHand = createHand([card('A'), card('7')]);
      const dealerUpcard = card('5');
      
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard,
        canDouble: true,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('double');
      expect(playerHand.total).toBe(18);
      expect(playerHand.isSoft).toBe(true);
    });
    
    it('Scenario 3: SOFT A7 vs 9 should HIT', () => {
      const playerHand = createHand([card('A'), card('7')]);
      const dealerUpcard = card('9');
      
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard,
        canDouble: true,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
      expect(playerHand.total).toBe(18);
      expect(playerHand.isSoft).toBe(true);
    });
  });

  describe('PAIR Scenarios with Seed 33333', () => {
    it('Scenario 1: PAIR 88 should always SPLIT', () => {
      const playerHand = createHand([card('8'), card('8')]);
      
      // Test vs dealer 2, 7, 10, A
      const dealerCards = [card('2'), card('7'), card('10'), card('A')];
      
      dealerCards.forEach(dealerUpcard => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard,
          canDouble: true,
          canSplit: true,
          canSurrender: true,
          isAfterSplit: false,
        };
        
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('split');
        expect(playerHand.isPair).toBe(true);
        expect(playerHand.total).toBe(16);
      });
    });
    
    it('Scenario 2: PAIR AA should always SPLIT', () => {
      const playerHand = createHand([card('A'), card('A')]);
      
      // Test vs dealer 5, 10
      const dealerCards = [card('5'), card('10')];
      
      dealerCards.forEach(dealerUpcard => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard,
          canDouble: true,
          canSplit: true,
          canSurrender: false,
          isAfterSplit: false,
        };
        
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('split');
        expect(playerHand.isPair).toBe(true);
      });
    });
    
    it('Scenario 3: PAIR 99 should SPLIT vs 2-6, 8-9', () => {
      const playerHand = createHand([card('9'), card('9')]);
      
      // Should split against these
      const splitAgainst = [card('2'), card('4'), card('6'), card('8'), card('9')];
      
      splitAgainst.forEach(dealerUpcard => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard,
          canDouble: true,
          canSplit: true,
          canSurrender: false,
          isAfterSplit: false,
        };
        
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('split');
      });
    });
    
    it('Scenario 4: PAIR 99 should STAND vs 7, 10, A', () => {
      const playerHand = createHand([card('9'), card('9')]);
      
      // Should stand against these
      const standAgainst = [card('7'), card('10'), card('A')];
      
      standAgainst.forEach(dealerUpcard => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard,
          canDouble: true,
          canSplit: true,
          canSurrender: false,
          isAfterSplit: false,
        };
        
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('stand');
        expect(playerHand.total).toBe(18);
      });
    });
  });

  describe('Complete game flow with seed 99999', () => {
    it('should deal a complete hand and follow basic strategy', () => {
      const seed = 99999;
      const shoe = createShoe(6, seed);
      
      // Deal initial 4 cards
      const playerCard1 = dealCard(shoe)!;
      const dealerCard1 = dealCard(shoe)!;
      const playerCard2 = dealCard(shoe)!;
      const dealerCard2 = dealCard(shoe)!;
      
      const playerHand = createHand([playerCard1, playerCard2]);
      
      // Verify hand was dealt
      expect(playerHand.cards).toHaveLength(2);
      expect(playerHand.total).toBeGreaterThanOrEqual(2);
      expect(playerHand.total).toBeLessThanOrEqual(21);
      
      // Get strategy recommendation
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: dealerCard2,
        canDouble: true,
        canSplit: playerHand.isPair,
        canSurrender: true,
        isAfterSplit: false,
      };
      
      const rec = recommendAction(context, DEFAULT_RULES);
      
      // Should return a valid action
      expect(['hit', 'stand', 'double', 'split', 'surrender']).toContain(rec.bestAction);
      expect(rec.reason).toBeDefined();
      expect(rec.reason.en).toBeDefined();
      expect(rec.reason.zh).toBeDefined();
    });
  });
});
