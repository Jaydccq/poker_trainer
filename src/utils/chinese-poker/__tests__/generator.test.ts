/**
 * Tests for valid arrangement generator
 */

import { Card } from '@/poker/solver/cards';
import {
  generateValidArrangements,
  countValidArrangements,
  hasValidArrangement,
  getArrangementStats
} from '../generator';
import { validateArrangement } from '../validation';

describe('Valid Arrangement Generator', () => {
  describe('generateValidArrangements', () => {
    it('should generate valid arrangements for a typical hand', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const arrangements = generateValidArrangements(cards);

      expect(arrangements.length).toBeGreaterThan(0);

      // Verify all arrangements are valid
      for (const arr of arrangements) {
        const validation = validateArrangement(arr.front, arr.middle, arr.back);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should respect maxArrangements option', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const arrangements = generateValidArrangements(cards, { maxArrangements: 10 });

      expect(arrangements.length).toBeLessThanOrEqual(10);
    });

    it('should handle hand with few valid arrangements', () => {
      // Hand with strong high cards but weak structure
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

      const arrangements = generateValidArrangements(cards);

      // Should still find some valid arrangements
      expect(arrangements.length).toBeGreaterThan(0);

      // All should be valid
      for (const arr of arrangements) {
        const validation = validateArrangement(arr.front, arr.middle, arr.back);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should throw error for wrong card count', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' }
      ];

      expect(() => generateValidArrangements(cards)).toThrow('Must provide exactly 13 cards');
    });

    it('should use all 13 cards in each arrangement', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const arrangements = generateValidArrangements(cards, { maxArrangements: 5 });

      for (const arr of arrangements) {
        expect(arr.front.length).toBe(3);
        expect(arr.middle.length).toBe(5);
        expect(arr.back.length).toBe(5);

        // Total should be 13
        const total = [...arr.front, ...arr.middle, ...arr.back];
        expect(total.length).toBe(13);
      }
    });
  });

  describe('countValidArrangements', () => {
    it('should count valid arrangements correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const count = countValidArrangements(cards);
      const arrangements = generateValidArrangements(cards);

      expect(count).toBe(arrangements.length);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('hasValidArrangement', () => {
    it('should return true for hand with valid arrangements', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      expect(hasValidArrangement(cards)).toBe(true);
    });

    it('should be fast (stops at first valid arrangement)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const start = Date.now();
      const result = hasValidArrangement(cards);
      const duration = Date.now() - start;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('getArrangementStats', () => {
    it('should return correct statistics', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '7', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '5', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const stats = getArrangementStats(cards);

      expect(stats.totalTheoretical).toBe(72072);
      expect(stats.totalValid).toBeGreaterThan(0);
      expect(stats.totalValid).toBeLessThan(stats.totalTheoretical);
      expect(stats.validPercentage).toBeGreaterThan(0);
      expect(stats.validPercentage).toBeLessThan(100);
      expect(stats.validPercentage).toBe((stats.totalValid / stats.totalTheoretical) * 100);
    });
  });

  describe('pruning effectiveness', () => {
    it('should prune invalid branches early', () => {
      // Hand that should have many invalid arrangements
      const cards: Card[] = [
        { rank: '2', suit: 'h' },
        { rank: '2', suit: 'd' },
        { rank: '2', suit: 'c' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '4', suit: 'h' },
        { rank: '4', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 'h' },
        { rank: '5', suit: 'd' }
      ];

      const stats = getArrangementStats(cards);

      // Should have significantly fewer valid arrangements than theoretical
      expect(stats.validPercentage).toBeLessThan(60);
    });
  });
});
