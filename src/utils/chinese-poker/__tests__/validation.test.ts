/**
 * Tests for arrangement validation and foul detection
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  validateArrangement,
  isFoul,
  getFoulReasons,
  validateArrangementFromHand
} from '../validation';

describe('Arrangement Validation', () => {
  describe('validateArrangement', () => {
    it('should validate a valid arrangement', () => {
      const front: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '2', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const result = validateArrangement(front, middle, back);
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should detect middle stronger than back (foul)', () => {
      const front: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '2', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' }
      ]; // Full house

      const back: Card[] = [
        { rank: '9', suit: 's' },
        { rank: '9', suit: 'c' },
        { rank: '5', suit: 'd' },
        { rank: '4', suit: 'h' },
        { rank: '3', suit: 'd' }
      ]; // Two pair (weaker than full house)

      const result = validateArrangement(front, middle, back);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('MIDDLE_STRONGER_THAN_BACK');
    });

    it('should detect front stronger than middle (foul)', () => {
      const front: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' }
      ]; // Three of a kind

      const middle: Card[] = [
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' }
      ]; // One pair (weaker than front trips)

      const back: Card[] = [
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'c' },
        { rank: 'J', suit: 'h' }
      ]; // Full house

      const result = validateArrangement(front, middle, back);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('FRONT_STRONGER_THAN_MIDDLE');
    });

    it('should detect invalid card counts', () => {
      const front: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' }
      ]; // Only 2 cards!

      const middle: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const result = validateArrangement(front, middle, back);
      expect(result.isValid).toBe(false);
      expect(result.violations[0].type).toBe('INVALID_CARD_COUNT');
    });

    it('should detect duplicate cards', () => {
      const front: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '2', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: '7', suit: 'h' }, // Duplicate!
        { rank: '9', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const result = validateArrangement(front, middle, back);
      expect(result.isValid).toBe(false);
      expect(result.violations[0].type).toBe('INVALID_CARD_COUNT');
      expect(result.violations[0].message).toContain('duplicate');
    });
  });

  describe('isFoul', () => {
    it('should return false for valid arrangement', () => {
      const valid: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 'h' },
          { rank: '9', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '3', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'h' }
        ]
      };

      expect(isFoul(valid)).toBe(false);
    });

    it('should return true for fouled arrangement', () => {
      const fouled: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'K', suit: 'h' }
        ], // Full house
        back: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '5', suit: 'd' },
          { rank: '4', suit: 'h' },
          { rank: '3', suit: 'd' }
        ] // Two pair
      };

      expect(isFoul(fouled)).toBe(true);
    });
  });

  describe('getFoulReasons', () => {
    it('should return empty array for valid arrangement', () => {
      const valid: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 'h' },
          { rank: '9', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '3', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'h' }
        ]
      };

      expect(getFoulReasons(valid)).toEqual([]);
    });

    it('should return detailed reasons for foul', () => {
      const fouled: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'K', suit: 'h' }
        ],
        back: [
          { rank: '9', suit: 's' },
          { rank: '9', suit: 'c' },
          { rank: '5', suit: 'd' },
          { rank: '4', suit: 'h' },
          { rank: '3', suit: 'd' }
        ]
      };

      const reasons = getFoulReasons(fouled);
      expect(reasons).toHaveLength(1);
      expect(reasons[0]).toContain('Middle');
      expect(reasons[0]).toContain('stronger');
      expect(reasons[0]).toContain('Back');
    });
  });

  describe('validateArrangementFromHand', () => {
    it('should validate arrangement comes from original hand', () => {
      const originalHand: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '2', suit: 'c' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const arrangement: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: '9', suit: 'h' },
          { rank: '9', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '3', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'h' }
        ]
      };

      const result = validateArrangementFromHand(arrangement, originalHand);
      expect(result.isValid).toBe(true);
    });

    it('should detect cards not from original hand', () => {
      const originalHand: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '2', suit: 'c' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const arrangement: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '2', suit: 'c' }
        ],
        middle: [
          { rank: 'J', suit: 'h' }, // Not in original hand!
          { rank: '9', suit: 'd' },
          { rank: '5', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '3', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'h' }
        ]
      };

      const result = validateArrangementFromHand(arrangement, originalHand);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.message.includes('not in the original hand'))).toBe(true);
    });
  });
});
