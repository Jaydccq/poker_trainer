/**
 * Tests for royalty/bonus system
 */

import { Card } from '@/poker/solver/cards';
import {
  calculateFrontRoyalty,
  calculateMiddleRoyalty,
  calculateBackRoyalty,
  calculateRoyalty
} from '../royalty';

describe('Royalty System', () => {
  describe('calculateFrontRoyalty', () => {
    it('should return 0 for high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(0);
    });

    it('should return 0 for pairs below 6-6', () => {
      const cards: Card[] = [
        { rank: '5', suit: 'h' },
        { rank: '5', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(0);
    });

    it('should award 1 point for 6-6', () => {
      const cards: Card[] = [
        { rank: '6', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(1);
    });

    it('should award 5 points for T-T', () => {
      const cards: Card[] = [
        { rank: 'T', suit: 'h' },
        { rank: 'T', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(5);
    });

    it('should award 9 points for A-A', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(9);
    });

    it('should award 10 points for trips 2-2-2', () => {
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(10);
    });

    it('should award 22 points for trips A-A-A', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(22);
    });

    it('should return 0 for invalid card count', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' }
      ];

      expect(calculateFrontRoyalty(cards)).toBe(0);
    });
  });

  describe('calculateMiddleRoyalty', () => {
    it('should return 0 for high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: '9', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(0);
    });

    it('should return 0 for one pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(0);
    });

    it('should return 0 for two pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(0);
    });

    it('should award 2 points for three of a kind', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(2);
    });

    it('should award 4 points for straight', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '6', suit: 's' },
        { rank: '5', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(4);
    });

    it('should award 8 points for flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: '9', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(8);
    });

    it('should award 12 points for full house', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(12);
    });

    it('should award 20 points for four of a kind', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(20);
    });

    it('should award 30 points for straight flush', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(30);
    });

    it('should award 50 points for royal flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(50);
    });

    it('should return 0 for invalid card count', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ];

      expect(calculateMiddleRoyalty(cards)).toBe(0);
    });
  });

  describe('calculateBackRoyalty', () => {
    it('should return 0 for high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: '9', suit: 'h' }
      ];

      expect(calculateBackRoyalty(cards)).toBe(0);
    });

    it('should return 0 for pairs, two pair, trips, straight, flush, full house', () => {
      // These hands don't get royalties in the back row
      const fullHouse: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      expect(calculateBackRoyalty(fullHouse)).toBe(0);
    });

    it('should award 10 points for four of a kind', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      expect(calculateBackRoyalty(cards)).toBe(10);
    });

    it('should award 15 points for straight flush', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' }
      ];

      expect(calculateBackRoyalty(cards)).toBe(15);
    });

    it('should award 25 points for royal flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' }
      ];

      expect(calculateBackRoyalty(cards)).toBe(25);
    });
  });

  describe('calculateRoyalty', () => {
    it('should calculate total royalty for arrangement', () => {
      const front: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'J', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: 'T', suit: 'd' },
        { rank: 'T', suit: 's' },
        { rank: 'T', suit: 'c' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' }
      ];

      const result = calculateRoyalty(front, middle, back);

      expect(result.front).toBe(9); // A-A
      expect(result.middle).toBe(12); // Full house
      expect(result.back).toBe(10); // Four of a kind
      expect(result.total).toBe(31);
    });

    it('should return 0 for arrangement with no royalties', () => {
      const front: Card[] = [
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: '9', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: '8', suit: 'd' },
        { rank: '8', suit: 's' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'd' }
      ];

      const result = calculateRoyalty(front, middle, back);

      expect(result.front).toBe(0);
      expect(result.middle).toBe(0);
      expect(result.back).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should calculate royalty with only front bonus', () => {
      const front: Card[] = [
        { rank: 'T', suit: 'h' },
        { rank: 'T', suit: 'd' },
        { rank: '3', suit: 'c' }
      ];

      const middle: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' }
      ];

      const back: Card[] = [
        { rank: 'J', suit: 'd' },
        { rank: 'J', suit: 's' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' },
        { rank: '9', suit: 'd' }
      ];

      const result = calculateRoyalty(front, middle, back);

      expect(result.front).toBe(5); // T-T
      expect(result.middle).toBe(0); // Two pair
      expect(result.back).toBe(0); // Trips
      expect(result.total).toBe(5);
    });
  });
});
