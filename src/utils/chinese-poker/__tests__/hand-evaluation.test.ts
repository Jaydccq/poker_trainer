/**
 * Unit tests for Chinese Poker hand evaluation
 */

import { Card } from '@/poker/solver/cards';
import {
  evaluateThreeCardHand,
  compareThreeCardHands,
  getThreeCardValue
} from '../hand-3card';
import {
  evaluateFiveCardHand,
  compareFiveCardHands,
  getFiveCardValue
} from '../hand-5card';
import { ThreeCardRank, FiveCardRank } from '@/types/chinese-poker';

describe('3-Card Hand Evaluation', () => {
  describe('evaluateThreeCardHand', () => {
    it('should recognize three of a kind', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' }
      ];

      const result = evaluateThreeCardHand(cards);
      expect(result.rank).toBe(ThreeCardRank.THREE_OF_A_KIND);
      expect(result.primaryValue).toBe(0); // 2 = 0
      expect(result.kickers).toEqual([]);
    });

    it('should recognize a pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' }
      ];

      const result = evaluateThreeCardHand(cards);
      expect(result.rank).toBe(ThreeCardRank.PAIR);
      expect(result.primaryValue).toBe(12); // A = 12
      expect(result.kickers).toEqual([11]); // K = 11
    });

    it('should recognize high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ];

      const result = evaluateThreeCardHand(cards);
      expect(result.rank).toBe(ThreeCardRank.HIGH_CARD);
      expect(result.primaryValue).toBe(12); // A = 12
      expect(result.kickers).toEqual([11, 10]); // K, Q
    });

    it('should throw error for invalid card count', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' }
      ];

      expect(() => evaluateThreeCardHand(cards)).toThrow('Must have exactly 3 cards');
    });
  });

  describe('compareThreeCardHands', () => {
    it('should rank trips higher than pair', () => {
      const trips = evaluateThreeCardHand([
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' }
      ]);

      const pair = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' }
      ]);

      expect(compareThreeCardHands(trips, pair)).toBeGreaterThan(0);
      expect(compareThreeCardHands(pair, trips)).toBeLessThan(0);
    });

    it('should rank higher pair over lower pair', () => {
      const aces = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: '7', suit: 'c' }
      ]);

      const kings = evaluateThreeCardHand([
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: '7', suit: 'c' }
      ]);

      expect(compareThreeCardHands(aces, kings)).toBeGreaterThan(0);
      expect(compareThreeCardHands(kings, aces)).toBeLessThan(0);
    });

    it('should use kicker when pairs are equal', () => {
      const aa7 = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: '7', suit: 'c' }
      ]);

      const aa5 = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: '5', suit: 'c' }
      ]);

      expect(compareThreeCardHands(aa7, aa5)).toBeGreaterThan(0);
    });

    it('should detect exact ties', () => {
      const hand1 = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ]);

      const hand2 = evaluateThreeCardHand([
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' }
      ]);

      expect(compareThreeCardHands(hand1, hand2)).toBe(0);
    });

    it('should rank pair over high card', () => {
      const pair = evaluateThreeCardHand([
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '3', suit: 'c' }
      ]);

      const highCard = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ]);

      expect(compareThreeCardHands(pair, highCard)).toBeGreaterThan(0);
    });
  });

  describe('getThreeCardValue', () => {
    it('should produce higher values for better hands', () => {
      const trips = evaluateThreeCardHand([
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' }
      ]);

      const pair = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' }
      ]);

      const highCard = evaluateThreeCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ]);

      expect(getThreeCardValue(trips)).toBeGreaterThan(getThreeCardValue(pair));
      expect(getThreeCardValue(pair)).toBeGreaterThan(getThreeCardValue(highCard));
    });
  });
});

describe('5-Card Hand Evaluation', () => {
  describe('evaluateFiveCardHand', () => {
    it('should recognize royal flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.ROYAL_FLUSH);
    });

    it('should recognize straight flush', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.STRAIGHT_FLUSH);
    });

    it('should recognize four of a kind', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '9', suit: 'c' },
        { rank: '9', suit: 's' },
        { rank: '5', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.FOUR_OF_A_KIND);
    });

    it('should recognize full house', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.FULL_HOUSE);
    });

    it('should recognize flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '5', suit: 'h' },
        { rank: '2', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.FLUSH);
    });

    it('should recognize straight', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.STRAIGHT);
    });

    it('should recognize wheel (A-2-3-4-5) as straight', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '4', suit: 's' },
        { rank: '5', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.STRAIGHT);
    });

    it('should recognize three of a kind', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '9', suit: 'c' },
        { rank: '5', suit: 's' },
        { rank: '4', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.THREE_OF_A_KIND);
    });

    it('should recognize two pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.TWO_PAIR);
    });

    it('should recognize one pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.ONE_PAIR);
    });

    it('should recognize high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: '9', suit: 'h' }
      ];

      const result = evaluateFiveCardHand(cards);
      expect(result.rank).toBe(FiveCardRank.HIGH_CARD);
    });
  });

  describe('compareFiveCardHands', () => {
    it('should rank royal flush over straight flush', () => {
      const royalFlush = evaluateFiveCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' }
      ]);

      const straightFlush = evaluateFiveCardHand([
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' }
      ]);

      expect(compareFiveCardHands(royalFlush, straightFlush)).toBeGreaterThan(0);
    });

    it('should compare full houses correctly', () => {
      const aaakk = evaluateFiveCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' }
      ]);

      const kkkaa = evaluateFiveCardHand([
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' }
      ]);

      expect(compareFiveCardHands(aaakk, kkkaa)).toBeGreaterThan(0);
    });

    it('should compare flushes by high cards', () => {
      const aHighFlush = evaluateFiveCardHand([
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '5', suit: 'h' },
        { rank: '2', suit: 'h' }
      ]);

      const nineHighFlush = evaluateFiveCardHand([
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'd' },
        { rank: '5', suit: 'd' },
        { rank: '3', suit: 'd' },
        { rank: '2', suit: 'd' }
      ]);

      expect(compareFiveCardHands(aHighFlush, nineHighFlush)).toBeGreaterThan(0);
      expect(compareFiveCardHands(nineHighFlush, aHighFlush)).toBeLessThan(0);
    });
  });
});
