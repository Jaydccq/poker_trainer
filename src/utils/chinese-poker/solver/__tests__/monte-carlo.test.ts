/**
 * Tests for Monte Carlo simulator
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  simulateArrangement,
  SimulationOptions,
  SimulationResult
} from '../monte-carlo';
import { ScoringRule } from '../../scoring/basic-scoring';

describe('Monte Carlo Simulator', () => {
  describe('simulateArrangement', () => {
    it('should run simulations and return average score', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' }
        ],
        middle: [
          { rank: 'Q', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'J', suit: 'h' }
        ],
        back: [
          { rank: 'T', suit: 'd' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'c' },
          { rank: 'T', suit: 'h' },
          { rank: '9', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 12345
      };

      const result = simulateArrangement(arrangement, usedCards, options);

      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.winRate).toBeGreaterThan(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
      expect(result.iterations).toBe(100);
      expect(result.scoopRate).toBeGreaterThanOrEqual(0);
    });

    it('should support multiple opponents', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' }
        ],
        middle: [
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: '4', suit: 'h' },
          { rank: '3', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 50,
        numOpponents: 3,
        scoringRule: ScoringRule.TWO_FOUR,
        seed: 54321
      };

      const result = simulateArrangement(arrangement, usedCards, options);

      expect(result.iterations).toBe(50);
      expect(result.averageScore).toBeDefined();
    });

    it('should be deterministic with same seed', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '5', suit: 'h' },
          { rank: '4', suit: 'd' },
          { rank: '3', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 'h' }
        ],
        back: [
          { rank: '9', suit: 'd' },
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '7', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 99999
      };

      const result1 = simulateArrangement(arrangement, usedCards, options);
      const result2 = simulateArrangement(arrangement, usedCards, options);

      expect(result1.averageScore).toBe(result2.averageScore);
      expect(result1.winRate).toBe(result2.winRate);
    });
  });
});
