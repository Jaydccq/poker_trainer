/**
 * Tests for special hands detection
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  SpecialHandType,
  isDragon,
  isSixPairs,
  isThreeFlushes,
  isThreeStraights,
  detectSpecialHandFromCards,
  detectSpecialHandFromArrangement,
  getAllSpecialHands
} from '../special-hands';

describe('Special Hands Detection', () => {
  describe('isDragon', () => {
    it('should detect a valid Dragon (一条龙)', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      expect(isDragon(cards)).toBe(true);
    });

    it('should reject hand with duplicate ranks', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' }, // Duplicate rank
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      expect(isDragon(cards)).toBe(false);
    });

    it('should reject hand with missing ranks', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'J', suit: 'c' }, // Missing Q
        { rank: 'K', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      expect(isDragon(cards)).toBe(false);
    });

    it('should reject hands with wrong card count', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' }
      ];

      expect(isDragon(cards)).toBe(false);
    });
  });

  describe('isSixPairs', () => {
    it('should detect valid Six Pairs (六对半)', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '4', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: 'A', suit: 'h' } // Single
      ];

      expect(isSixPairs(cards)).toBe(true);
    });

    it('should reject hand with only 5 pairs', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '4', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' }
      ];

      expect(isSixPairs(cards)).toBe(false);
    });

    it('should reject hand with three of a kind', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' }, // Three of a kind
        { rank: '3', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '6', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '7', suit: 'h' }
      ];

      expect(isSixPairs(cards)).toBe(false);
    });
  });

  describe('isThreeFlushes', () => {
    it('should detect valid Three Flushes (三同花)', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '5', suit: 'h' },
          { rank: '7', suit: 'h' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '6', suit: 'd' },
          { rank: '9', suit: 'd' },
          { rank: 'J', suit: 'd' },
          { rank: 'K', suit: 'd' }
        ],
        back: [
          { rank: '4', suit: 'c' },
          { rank: '8', suit: 'c' },
          { rank: 'T', suit: 'c' },
          { rank: 'Q', suit: 'c' },
          { rank: 'A', suit: 'c' }
        ]
      };

      expect(isThreeFlushes(arrangement)).toBe(true);
    });

    it('should reject when front is not flush', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '5', suit: 'd' }, // Different suit
          { rank: '7', suit: 'h' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '6', suit: 'd' },
          { rank: '9', suit: 'd' },
          { rank: 'J', suit: 'd' },
          { rank: 'K', suit: 'd' }
        ],
        back: [
          { rank: '4', suit: 'c' },
          { rank: '8', suit: 'c' },
          { rank: 'T', suit: 'c' },
          { rank: 'Q', suit: 'c' },
          { rank: 'A', suit: 'c' }
        ]
      };

      expect(isThreeFlushes(arrangement)).toBe(false);
    });

    it('should reject when middle is not flush', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '5', suit: 'h' },
          { rank: '7', suit: 'h' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '6', suit: 's' }, // Different suit
          { rank: '9', suit: 'd' },
          { rank: 'J', suit: 'd' },
          { rank: 'K', suit: 'd' }
        ],
        back: [
          { rank: '4', suit: 'c' },
          { rank: '8', suit: 'c' },
          { rank: 'T', suit: 'c' },
          { rank: 'Q', suit: 'c' },
          { rank: 'A', suit: 'c' }
        ]
      };

      expect(isThreeFlushes(arrangement)).toBe(false);
    });
  });

  describe('isThreeStraights', () => {
    it('should detect valid Three Straights (三顺子)', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '3', suit: 'd' },
          { rank: '4', suit: 'c' }
        ],
        middle: [
          { rank: '5', suit: 's' },
          { rank: '6', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '8', suit: 'c' },
          { rank: '9', suit: 's' }
        ],
        back: [
          { rank: 'T', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'A', suit: 'h' }
        ]
      };

      expect(isThreeStraights(arrangement)).toBe(true);
    });

    it('should detect wheel (A-2-3) in front', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: '2', suit: 'd' },
          { rank: '3', suit: 'c' }
        ],
        middle: [
          { rank: '4', suit: 's' },
          { rank: '5', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '7', suit: 'c' },
          { rank: '8', suit: 's' }
        ],
        back: [
          { rank: '9', suit: 'h' },
          { rank: 'T', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'Q', suit: 's' },
          { rank: 'K', suit: 'h' }
        ]
      };

      expect(isThreeStraights(arrangement)).toBe(true);
    });

    it('should reject when front is not straight', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '3', suit: 'd' },
          { rank: '5', suit: 'c' } // Gap
        ],
        middle: [
          { rank: '6', suit: 's' },
          { rank: '7', suit: 'h' },
          { rank: '8', suit: 'd' },
          { rank: '9', suit: 'c' },
          { rank: 'T', suit: 's' }
        ],
        back: [
          { rank: 'J', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'K', suit: 'c' },
          { rank: 'A', suit: 's' },
          { rank: '4', suit: 'h' }
        ]
      };

      expect(isThreeStraights(arrangement)).toBe(false);
    });
  });

  describe('detectSpecialHandFromCards', () => {
    it('should detect Dragon', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      const result = detectSpecialHandFromCards(cards);
      expect(result.type).toBe(SpecialHandType.DRAGON);
      expect(result.isValid).toBe(true);
      expect(result.points).toBe(13);
    });

    it('should detect Six Pairs', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '4', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      const result = detectSpecialHandFromCards(cards);
      expect(result.type).toBe(SpecialHandType.SIX_PAIRS);
      expect(result.isValid).toBe(true);
      expect(result.points).toBe(3);
    });

    it('should return null for regular hand', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' }, // Duplicate rank, not a Dragon
        { rank: '5', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '9', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'A', suit: 's' },
        { rank: '4', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: 'T', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const result = detectSpecialHandFromCards(cards);
      expect(result.type).toBe(null);
      expect(result.isValid).toBe(false);
      expect(result.points).toBe(0);
    });
  });

  describe('detectSpecialHandFromArrangement', () => {
    it('should detect Three Flushes', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '5', suit: 'h' },
          { rank: '7', suit: 'h' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '6', suit: 'd' },
          { rank: '9', suit: 'd' },
          { rank: 'J', suit: 'd' },
          { rank: 'K', suit: 'd' }
        ],
        back: [
          { rank: '4', suit: 'c' },
          { rank: '8', suit: 'c' },
          { rank: 'T', suit: 'c' },
          { rank: 'Q', suit: 'c' },
          { rank: 'A', suit: 'c' }
        ]
      };

      const result = detectSpecialHandFromArrangement(arrangement);
      expect(result.type).toBe(SpecialHandType.THREE_FLUSHES);
      expect(result.isValid).toBe(true);
      expect(result.points).toBe(3);
    });

    it('should detect Three Straights', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '3', suit: 'd' },
          { rank: '4', suit: 'c' }
        ],
        middle: [
          { rank: '5', suit: 's' },
          { rank: '6', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '8', suit: 'c' },
          { rank: '9', suit: 's' }
        ],
        back: [
          { rank: 'T', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'A', suit: 'h' }
        ]
      };

      const result = detectSpecialHandFromArrangement(arrangement);
      expect(result.type).toBe(SpecialHandType.THREE_STRAIGHTS);
      expect(result.isValid).toBe(true);
      expect(result.points).toBe(3);
    });
  });

  describe('getAllSpecialHands', () => {
    it('should prioritize Dragon over arrangement-based special hands', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '7', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'J', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'A', suit: 'h' }
      ];

      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '3', suit: 'd' },
          { rank: '4', suit: 'c' }
        ],
        middle: [
          { rank: '5', suit: 's' },
          { rank: '6', suit: 'h' },
          { rank: '7', suit: 'd' },
          { rank: '8', suit: 'c' },
          { rank: '9', suit: 's' }
        ],
        back: [
          { rank: 'T', suit: 'h' },
          { rank: 'J', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'A', suit: 'h' }
        ]
      };

      const result = getAllSpecialHands(cards, arrangement);
      expect(result.type).toBe(SpecialHandType.DRAGON);
      expect(result.points).toBe(13);
    });

    it('should check arrangement if no card-based special hand', () => {
      // Hand with no Dragon or Six Pairs, but forms Three Flushes when arranged
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '5', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '6', suit: 'd' },
        { rank: '9', suit: 'd' },
        { rank: 'J', suit: 'd' },
        { rank: 'K', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '8', suit: 'c' },
        { rank: 'T', suit: 'c' },
        { rank: 'Q', suit: 'c' },
        { rank: 'Q', suit: 'h' } // Duplicate Q to avoid Dragon
      ];

      const arrangement: Arrangement = {
        front: [
          { rank: '2', suit: 'h' },
          { rank: '5', suit: 'h' },
          { rank: '7', suit: 'h' }
        ],
        middle: [
          { rank: '3', suit: 'd' },
          { rank: '6', suit: 'd' },
          { rank: '9', suit: 'd' },
          { rank: 'J', suit: 'd' },
          { rank: 'K', suit: 'd' }
        ],
        back: [
          { rank: '4', suit: 'c' },
          { rank: '8', suit: 'c' },
          { rank: 'T', suit: 'c' },
          { rank: 'Q', suit: 'c' },
          { rank: 'Q', suit: 'h' } // Mixed suit, so NOT three flushes
        ]
      };

      const result = getAllSpecialHands(cards, arrangement);
      // Back is not flush, so no special hand
      expect(result.type).toBe(null);
      expect(result.points).toBe(0);
    });
  });
});
