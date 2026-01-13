/**
 * Tests for EV calculator
 */

import { Card } from '@/poker/solver/cards';
import {
  calculateArrangementEV,
  findOptimalArrangement,
  getHandTypes,
  EVCalculationOptions
} from '../ev-calculator';
import { ScoringRule } from '../../scoring/basic-scoring';

describe('EV Calculator', () => {
  describe('getHandTypes', () => {
    it('should return hand type descriptions for an arrangement', () => {
      const arrangement = {
        front: [
          { rank: 'A' as const, suit: 'h' as const },
          { rank: 'A' as const, suit: 'd' as const },
          { rank: 'K' as const, suit: 'c' as const }
        ],
        middle: [
          { rank: 'Q' as const, suit: 'h' as const },
          { rank: 'Q' as const, suit: 'd' as const },
          { rank: 'Q' as const, suit: 'c' as const },
          { rank: 'J' as const, suit: 's' as const },
          { rank: 'J' as const, suit: 'h' as const }
        ],
        back: [
          { rank: 'T' as const, suit: 'd' as const },
          { rank: 'T' as const, suit: 's' as const },
          { rank: 'T' as const, suit: 'c' as const },
          { rank: 'T' as const, suit: 'h' as const },
          { rank: '9' as const, suit: 'd' as const }
        ]
      };

      const handTypes = getHandTypes(arrangement);

      expect(handTypes.front.description).toContain('Pair');
      expect(handTypes.middle.description).toContain('Full House');
      expect(handTypes.back.description).toContain('Four');
    });
  });

  describe('calculateArrangementEV', () => {
    it('should calculate EV for a specific arrangement', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' },
        { rank: 'T', suit: 's' },
        { rank: 'T', suit: 'c' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' }
      ];

      const options: EVCalculationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 12345
      };

      const result = calculateArrangementEV(cards, 0, options);

      expect(result.ev).toBeDefined();
      expect(result.arrangement).toBeDefined();
      expect(result.arrangement.front.length).toBe(3);
      expect(result.arrangement.middle.length).toBe(5);
      expect(result.arrangement.back.length).toBe(5);
      expect(result.handTypes).toBeDefined();
      expect(result.handTypes.front.description).toBeDefined();
    });
  });

  describe('findOptimalArrangement', () => {
    it('should find arrangement with highest EV using heuristic sorting', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: '4', suit: 'h' },
        { rank: '3', suit: 'd' }
      ];

      const options: EVCalculationOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.TWO_FOUR,
        maxArrangements: 10,
        seed: 54321
      };

      const result = findOptimalArrangement(cards, options);

      expect(result.optimalArrangement).toBeDefined();
      expect(result.optimalEV).toBeDefined();
      expect(result.arrangementsEvaluated).toBeLessThanOrEqual(10);
      expect(result.totalArrangementsGenerated).toBeGreaterThan(0);
      expect(result.optimalHandTypes).toBeDefined();
    });

    it('should handle special hands', () => {
      // Dragon hand
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '2', suit: 'h' }
      ];

      const options: EVCalculationOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 99999
      };

      const result = findOptimalArrangement(cards, options);

      // Dragon should auto-win with 13 points
      expect(result.optimalEV).toBeGreaterThanOrEqual(13);
      expect(result.specialHand).toBeDefined();
    });

    it('should prioritize back hand strength in heuristic', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'T', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'd' }
      ];

      const options: EVCalculationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 50,
        seed: 12345
      };

      const result = findOptimalArrangement(cards, options);

      // The optimal arrangement should have a strong back (trips AAA or full house)
      expect(result.optimalHandTypes.back.rank).toBeGreaterThanOrEqual(3); // At least 3 of a kind
    });
  });
});
