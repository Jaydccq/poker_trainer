/**
 * Tests for post-game analyzer
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  analyzePlayerChoice,
  analyzePlayerChoiceWithPreCalc,
  preCalculateOptimal,
  AnalysisOptions
} from '../analyzer';
import { ScoringRule } from '../../scoring/basic-scoring';

describe('Post-Game Analyzer', () => {
  describe('preCalculateOptimal', () => {
    it('should pre-calculate optimal arrangement', () => {
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

      const options: AnalysisOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 20,
        seed: 12345
      };

      const result = preCalculateOptimal(cards, options);

      expect(result.optimalResult).toBeDefined();
      expect(result.optimalResult.optimalArrangement).toBeDefined();
      expect(result.optimalResult.optimalHandTypes).toBeDefined();
      expect(result.calculationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzePlayerChoice', () => {
    it('should compare player arrangement vs optimal with hand types', () => {
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

      // Suboptimal arrangement
      const playerArrangement: Arrangement = {
        front: [
          { rank: 'K', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: '9', suit: 'd' }
        ],
        middle: [
          { rank: 'Q', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 'h' },
          { rank: 'T', suit: 'd' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'c' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const options: AnalysisOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 20,
        seed: 12345
      };

      const result = analyzePlayerChoice(cards, playerArrangement, options);

      expect(result.playerEV).toBeDefined();
      expect(result.optimalEV).toBeDefined();
      expect(result.evDifference).toBeDefined();
      expect(result.isOptimal).toBeDefined();
      expect(result.playerHandTypes).toBeDefined();
      expect(result.optimalHandTypes).toBeDefined();
      expect(result.playerHandTypes.front.description).toBeDefined();
      expect(result.playerHandTypes.middle.description).toBeDefined();
      expect(result.playerHandTypes.back.description).toBeDefined();
    });

    it('should provide analysis results with pre-calculation', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: '4', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' }
      ];

      const playerArrangement: Arrangement = {
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

      const options: AnalysisOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 10,
        seed: 54321
      };

      // Pre-calculate
      const preCalc = preCalculateOptimal(cards, options);
      
      // Then analyze with pre-calc
      const result = analyzePlayerChoiceWithPreCalc(cards, playerArrangement, preCalc, options);

      expect(result.playerEV).toBeDefined();
      expect(result.optimalEV).toBeDefined();
      expect(result.optimalArrangement).toBeDefined();
    });
  });
});
