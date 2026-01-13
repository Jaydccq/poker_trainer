/**
 * Tests for basic scoring system
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  ScoringRule,
  scoreMatchup,
  scoreMultiplayer,
  scoreFouledHand
} from '../basic-scoring';
import { SpecialHandType } from '../../special-hands';

describe('Basic Scoring', () => {
  describe('scoreMatchup - 1-1-1 rule', () => {
    it('should award 1 point per row won', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '9', suit: 'h' },
          { rank: '8', suit: 'd' },
          { rank: '7', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '8', suit: 's' },
          { rank: '7', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      const result = scoreMatchup(player1, player2, ScoringRule.ONE_ONE_ONE);

      expect(result.front.winner).toBe('player1');
      expect(result.middle.winner).toBe('player1');
      expect(result.back.winner).toBe('player1');
      expect(result.scoop).toBe(true);
      expect(result.totalPoints).toBe(6); // 3 rows + 3 scoop bonus
    });

    it('should handle split results', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '8', suit: 's' },
          { rank: '7', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '9', suit: 'h' },
          { rank: '8', suit: 'd' },
          { rank: '7', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      const result = scoreMatchup(player1, player2, ScoringRule.ONE_ONE_ONE);

      expect(result.front.winner).toBe('player1');
      expect(result.middle.winner).toBe('player2');
      expect(result.back.winner).toBe('player1');
      expect(result.scoop).toBe(false);
      expect(result.totalPoints).toBe(1); // Won front (+1) + back (+1) - middle (-1) = 1
    });

    it('should handle ties', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 's' },
          { rank: '5', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'T', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: '9', suit: 'h' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
          { rank: 'Q', suit: 'd' }
        ],
        middle: [
          { rank: '9', suit: 'c' },
          { rank: '8', suit: 'd' },
          { rank: '7', suit: 's' },
          { rank: '6', suit: 'h' },
          { rank: '5', suit: 'c' }
        ],
        back: [
          { rank: 'J', suit: 's' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 'h' },
          { rank: 'T', suit: 'd' },
          { rank: '9', suit: 'c' }
        ]
      };

      const result = scoreMatchup(player1, player2, ScoringRule.ONE_ONE_ONE);

      expect(result.front.winner).toBe('tie');
      expect(result.middle.winner).toBe('tie');
      expect(result.back.winner).toBe('tie');
      expect(result.scoop).toBe(false);
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('scoreMatchup - 2-4 rule', () => {
    it('should award 2 points for front/middle, 4 for back', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '9', suit: 'h' },
          { rank: '8', suit: 'd' },
          { rank: '7', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '8', suit: 's' },
          { rank: '7', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      const result = scoreMatchup(player1, player2, ScoringRule.TWO_FOUR);

      expect(result.front.points).toBe(2);
      expect(result.middle.points).toBe(2);
      expect(result.back.points).toBe(4);
      expect(result.scoop).toBe(true);
      expect(result.totalPoints).toBe(12); // 2 + 2 + 4 + 4 scoop bonus
    });
  });

  describe('scoreMatchup - 1-6 rule', () => {
    it('should award 1-2-6 points per row', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '9', suit: 'h' },
          { rank: '8', suit: 'd' },
          { rank: '7', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '8', suit: 's' },
          { rank: '7', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      const result = scoreMatchup(player1, player2, ScoringRule.ONE_SIX);

      expect(result.front.points).toBe(1);
      expect(result.middle.points).toBe(2);
      expect(result.back.points).toBe(6);
      expect(result.scoop).toBe(true);
      expect(result.totalPoints).toBe(18); // 1 + 2 + 6 + 9 Grand Slam bonus
    });
  });

  describe('scoreMatchup - special hands', () => {
    it('should add special hand bonus points', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 's' },
          { rank: '5', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'T', suit: 'c' },
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'h' },
          { rank: '7', suit: 'd' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '6', suit: 'h' },
          { rank: '5', suit: 'd' },
          { rank: '4', suit: 'c' }
        ],
        middle: [
          { rank: '3', suit: 's' },
          { rank: '3', suit: 'c' },
          { rank: '2', suit: 'h' },
          { rank: '2', suit: 's' },
          { rank: 'A', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 's' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      const player1Special = {
        type: SpecialHandType.DRAGON,
        points: 13
      };

      const result = scoreMatchup(
        player1,
        player2,
        ScoringRule.ONE_ONE_ONE,
        player1Special
      );

      expect(result.specialHandBonus).toBe(13);
      // Player1 wins all rows (3) + scoop (3) + dragon (13) = 19
      expect(result.totalPoints).toBe(19);
    });

    it('should handle both players having special hands', () => {
      const player1: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 's' },
          { rank: '5', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'T', suit: 'c' },
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'h' },
          { rank: '7', suit: 'd' }
        ]
      };

      const player2: Arrangement = {
        front: [
          { rank: '6', suit: 'c' },
          { rank: '5', suit: 'c' },
          { rank: '4', suit: 'c' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '2', suit: 'd' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 's' },
          { rank: '9', suit: 's' },
          { rank: '8', suit: 's' },
          { rank: '7', suit: 's' }
        ]
      };

      const player1Special = {
        type: SpecialHandType.SIX_PAIRS,
        points: 3
      };

      const player2Special = {
        type: SpecialHandType.THREE_FLUSHES,
        points: 3
      };

      const result = scoreMatchup(
        player1,
        player2,
        ScoringRule.ONE_ONE_ONE,
        player1Special,
        player2Special
      );

      expect(result.specialHandBonus).toBe(0); // 3 - 3 = 0
    });
  });

  describe('scoreMultiplayer', () => {
    it('should score 3-player game correctly', () => {
      const arrangements = new Map<string, Arrangement>();

      // Player 1: Strong hand
      arrangements.set('player1', {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'd' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'h' }
        ]
      });

      // Player 2: Medium hand
      arrangements.set('player2', {
        front: [
          { rank: '9', suit: 'h' },
          { rank: '9', suit: 'd' },
          { rank: '8', suit: 'c' }
        ],
        middle: [
          { rank: '8', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 's' },
          { rank: '6', suit: 'd' }
        ],
        back: [
          { rank: '6', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '5', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      });

      // Player 3: Weak hand
      arrangements.set('player3', {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' }
        ],
        middle: [
          { rank: '4', suit: 's' },
          { rank: '4', suit: 'c' },
          { rank: '3', suit: 'h' },
          { rank: '3', suit: 's' },
          { rank: '2', suit: 'd' }
        ],
        back: [
          { rank: '2', suit: 'h' },
          { rank: '2', suit: 'd' },
          { rank: 'A', suit: 'c' },
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' }
        ]
      });

      const scores = scoreMultiplayer(arrangements, ScoringRule.ONE_ONE_ONE);

      expect(scores.get('player1')).toBeGreaterThan(0); // Player 1 should win
      expect(scores.get('player3')).toBeLessThan(0); // Player 3 should lose

      // Sum of all scores should be 0 (zero-sum game)
      const totalScore = Array.from(scores.values()).reduce((a, b) => a + b, 0);
      expect(totalScore).toBe(0);
    });
  });

  describe('scoreFouledHand', () => {
    it('should calculate correct foul penalty for 1-1-1 rule', () => {
      const penalty = scoreFouledHand(ScoringRule.ONE_ONE_ONE);
      expect(penalty).toBe(-6); // -(1 + 1 + 1 + 3)
    });

    it('should calculate correct foul penalty for 2-4 rule', () => {
      const penalty = scoreFouledHand(ScoringRule.TWO_FOUR);
      expect(penalty).toBe(-12); // -(2 + 2 + 4 + 4)
    });

    it('should calculate correct foul penalty for 1-6 rule', () => {
      const penalty = scoreFouledHand(ScoringRule.ONE_SIX);
      expect(penalty).toBe(-18); // -(1 + 2 + 6 + 9)
    });
  });
});
