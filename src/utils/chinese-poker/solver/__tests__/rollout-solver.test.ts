/**
 * Tests for Rollout Solver
 */

import { Card } from '@/poker/solver/cards';
import { rolloutSolver, getHandTypes, RolloutOptions } from '../rollout-solver';
import { ScoringRule } from '../../scoring/basic-scoring';

describe('Rollout Solver', () => {
  describe('rolloutSolver', () => {
    it('should find optimal arrangement with rollout method', () => {
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

      const options: RolloutOptions & { maxEvaluate?: number } = {
        numSimulations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxEvaluate: 20,
        seed: 12345
      };

      const result = rolloutSolver(cards, options);

      expect(result.optimalArrangement).toBeDefined();
      expect(result.optimalEV).toBeDefined();
      expect(result.optimalHandTypes).toBeDefined();
      expect(result.arrangementsEvaluated).toBeLessThanOrEqual(20);
      expect(result.topArrangements.length).toBeLessThanOrEqual(10);
      
      // Optimal should have trips AAA in back (strong back)
      expect(result.optimalHandTypes.back.rank).toBeGreaterThanOrEqual(3);
    });

    it('should detect special hands', () => {
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

      const result = rolloutSolver(cards, {
        numSimulations: 20,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 99999
      });

      expect(result.specialHand).toBeDefined();
      expect(result.optimalEV).toBeGreaterThanOrEqual(13);
    });

    it('should handle multiple opponents', () => {
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
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'd' }
      ];

      const result = rolloutSolver(cards, {
        numSimulations: 30,
        numOpponents: 3,
        scoringRule: ScoringRule.TWO_FOUR,
        maxEvaluate: 10,
        seed: 54321
      });

      expect(result.optimalArrangement).toBeDefined();
      expect(result.optimalEV).toBeDefined();
    });

    it('should be deterministic with same seed', () => {
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

      const options = {
        numSimulations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxEvaluate: 20,
        seed: 99999
      };

      const result1 = rolloutSolver(cards, options);
      const result2 = rolloutSolver(cards, options);

      expect(result1.optimalEV).toBe(result2.optimalEV);
    });
  });

  describe('getHandTypes', () => {
    it('should return correct hand type descriptions', () => {
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

      const types = getHandTypes(arrangement);

      expect(types.front.description).toContain('Pair');
      expect(types.middle.description).toContain('Full House');
      expect(types.back.description).toContain('Four');
    });
  });
});
