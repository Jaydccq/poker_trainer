import { Card, GameRules } from '@/types';
import { recommendAction, StrategyContext } from '../strategy';
import { createHand } from '../hand';

// Helper to create cards
const card = (rank: string, suit = 'hearts'): Card => ({
  rank: rank as any,
  suit: suit as any,
  value: rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank),
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

describe('Strategy Recommendations', () => {
  describe('HARD 12 vs various dealer upcards', () => {
    const playerHand = createHand([card('10'), card('2')]);

    it('should HIT on HARD 12 vs 2', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('2'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });

    it('should HIT on HARD 12 vs 3', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('3'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });

    it('should STAND on HARD 12 vs 4', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('4'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('stand');
    });

    it('should STAND on HARD 12 vs 5', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('5'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('stand');
    });

    it('should STAND on HARD 12 vs 6', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('6'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('stand');
    });

    it('should HIT on HARD 12 vs 7', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('7'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });

    it('should HIT on HARD 12 vs A', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('A'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });
  });

  describe('SOFT A7 (18) vs various dealer upcards', () => {
    const playerHand = createHand([card('A'), card('7')]);

    it('should STAND on SOFT A7 vs 2 (S17 rules, cannot double)', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('2'),
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('stand');
    });

    it('should DOUBLE on SOFT A7 vs 5 if possible', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('5'),
        canDouble: true,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('double');
    });

    it('should HIT on SOFT A7 vs 5 if cannot double', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('5'),
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });

    it('should HIT on SOFT A7 vs 9', () => {
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('9'),
        canDouble: true,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('hit');
    });
  });

  describe('PAIR splits', () => {
    it('should always SPLIT 88', () => {
      const playerHand = createHand([card('8'), card('8')]);
      
      // Test against various dealer cards
      const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
      
      dealerCards.forEach(dealerRank => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard: card(dealerRank),
          canDouble: true,
          canSplit: true,
          canSurrender: true,
          isAfterSplit: false,
        };
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('split');
      });
    });

    it('should always SPLIT AA', () => {
      const playerHand = createHand([card('A'), card('A')]);
      
      // Test against various dealer cards
      const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
      
      dealerCards.forEach(dealerRank => {
        const context: StrategyContext = {
          hand: playerHand,
          dealerUpcard: card(dealerRank),
          canDouble: true,
          canSplit: true,
          canSurrender: true,
          isAfterSplit: false,
        };
        const rec = recommendAction(context, DEFAULT_RULES);
        expect(rec.bestAction).toBe('split');
      });
    });

    describe('PAIR 99 split recommendations', () => {
      const playerHand = createHand([card('9'), card('9')]);

      it('should SPLIT 99 vs 2-6, 8-9', () => {
        const splitAgainst = ['2', '3', '4', '5', '6', '8', '9'];
        
        splitAgainst.forEach(dealerRank => {
          const context: StrategyContext = {
            hand: playerHand,
            dealerUpcard: card(dealerRank),
            canDouble: true,
            canSplit: true,
            canSurrender: false,
            isAfterSplit: false,
          };
          const rec = recommendAction(context, DEFAULT_RULES);
          expect(rec.bestAction).toBe('split');
        });
      });

      it('should STAND on 99 vs 7, 10, A', () => {
        const standAgainst = ['7', '10', 'A'];
        
        standAgainst.forEach(dealerRank => {
          const context: StrategyContext = {
            hand: playerHand,
            dealerUpcard: card(dealerRank),
            canDouble: true,
            canSplit: true,
            canSurrender: false,
            isAfterSplit: false,
          };
          const rec = recommendAction(context, DEFAULT_RULES);
          expect(rec.bestAction).toBe('stand');
        });
      });
    });
  });

  describe('Double down restrictions', () => {
    it('should only allow double with exactly 2 cards', () => {
      const twoCardHand = createHand([card('5'), card('6')]);
      const threeCardHand = createHand([card('5'), card('3'), card('2')]);
      
      const context2Cards: StrategyContext = {
        hand: twoCardHand,
        dealerUpcard: card('5'),
        canDouble: true,
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      
      const context3Cards: StrategyContext = {
        hand: threeCardHand,
        dealerUpcard: card('5'),
        canDouble: false, // Game logic should set this to false
        canSplit: false,
        canSurrender: false,
        isAfterSplit: false,
      };
      
      const rec2 = recommendAction(context2Cards, DEFAULT_RULES);
      const rec3 = recommendAction(context3Cards, DEFAULT_RULES);
      
      // With 2 cards, should recommend double for 11
      expect(rec2.bestAction).toBe('double');
      
      // With 3 cards (10 total), should not be able to double
      // So recommendation should be hit or stand based on total
      expect(rec3.bestAction).not.toBe('double');
    });
  });

  describe('Surrender scenarios', () => {
    it('should SURRENDER on HARD 16 vs 9 (S17)', () => {
      const playerHand = createHand([card('10'), card('6')]);
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('9'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('surrender');
    });

    it('should SURRENDER on HARD 16 vs 10 (S17)', () => {
      const playerHand = createHand([card('10'), card('6')]);
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('10'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('surrender');
    });

    it('should SURRENDER on HARD 15 vs 10 (S17)', () => {
      const playerHand = createHand([card('10'), card('5')]);
      const context: StrategyContext = {
        hand: playerHand,
        dealerUpcard: card('10'),
        canDouble: false,
        canSplit: false,
        canSurrender: true,
        isAfterSplit: false,
      };
      const rec = recommendAction(context, DEFAULT_RULES);
      expect(rec.bestAction).toBe('surrender');
    });
  });
});
