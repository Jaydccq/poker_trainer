import { Card } from '@/types';
import {
  calculateTotal,
  isBlackjack,
  isPair,
  isBusted,
  getHandType,
  createHand,
  getHandKey,
} from '../hand';

// Helper to create cards easily
const card = (rank: string, suit = 'hearts'): Card => ({
  rank: rank as any,
  suit: suit as any,
  value: rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank),
});

describe('calculateTotal', () => {
  describe('Ace scoring (A=1/11)', () => {
    it('should count Ace as 11 initially', () => {
      const result = calculateTotal([card('A'), card('5')]);
      expect(result.total).toBe(16);
      expect(result.isSoft).toBe(true);
    });

    it('should count Ace as 11 for soft 20', () => {
      const result = calculateTotal([card('A'), card('9')]);
      expect(result.total).toBe(20);
      expect(result.isSoft).toBe(true);
    });

    it('should count Ace as 11 for blackjack', () => {
      const result = calculateTotal([card('A'), card('K')]);
      expect(result.total).toBe(21);
      expect(result.isSoft).toBe(true);
    });

    it('should convert Ace from 11 to 1 when busting', () => {
      const result = calculateTotal([card('A'), card('K'), card('5')]);
      expect(result.total).toBe(16);
      expect(result.isSoft).toBe(false);
    });

    it('should handle multiple Aces correctly', () => {
      const result = calculateTotal([card('A'), card('A'), card('9')]);
      expect(result.total).toBe(21);
      expect(result.isSoft).toBe(true); // One ace counts as 11
    });

    it('should handle multiple aces correctly (3 aces + 8)', () => {
      const result = calculateTotal([card('A'), card('A'), card('A'), card('8')]);
      expect(result.total).toBe(21); // One ace as 11, two as 1: 11 + 1 + 1 + 8 = 21
      expect(result.isSoft).toBe(true); // One ace still counts as 11
    });

    it('should handle soft 17', () => {
      const result = calculateTotal([card('A'), card('6')]);
      expect(result.total).toBe(17);
      expect(result.isSoft).toBe(true);
    });

    it('should handle soft 18', () => {
      const result = calculateTotal([card('A'), card('7')]);
      expect(result.total).toBe(18);
      expect(result.isSoft).toBe(true);
    });
  });

  describe('Hard hand totals', () => {
    it('should calculate hard 12', () => {
      const result = calculateTotal([card('10'), card('2')]);
      expect(result.total).toBe(12);
      expect(result.isSoft).toBe(false);
    });

    it('should calculate hard 16', () => {
      const result = calculateTotal([card('10'), card('6')]);
      expect(result.total).toBe(16);
      expect(result.isSoft).toBe(false);
    });

    it('should calculate hard 20', () => {
      const result = calculateTotal([card('K'), card('Q')]);
      expect(result.total).toBe(20);
      expect(result.isSoft).toBe(false);
    });
  });
});

describe('Soft/Hard hand determination', () => {
  it('should identify soft hands with usable Ace', () => {
    expect(getHandType([card('A'), card('5')])).toBe('soft');
    expect(getHandType([card('A'), card('7')])).toBe('soft');
    expect(getHandType([card('A'), card('9')])).toBe('soft');
  });

  it('should identify hard hands without Aces', () => {
    expect(getHandType([card('10'), card('6')])).toBe('hard');
    expect(getHandType([card('7'), card('8')])).toBe('hard');
  });

  it('should identify hard hands when Ace counts as 1', () => {
    const result = calculateTotal([card('A'), card('K'), card('5')]);
    expect(result.isSoft).toBe(false);
  });

  it('should identify pairs before soft/hard', () => {
    expect(getHandType([card('A'), card('A')])).toBe('pair');
    expect(getHandType([card('8'), card('8')])).toBe('pair');
  });
});

describe('isPair', () => {
  it('should identify number pairs', () => {
    expect(isPair([card('8'), card('8')])).toBe(true);
    expect(isPair([card('2'), card('2')])).toBe(true);
    expect(isPair([card('9'), card('9')])).toBe(true);
  });

  it('should identify Ace pairs', () => {
    expect(isPair([card('A'), card('A')])).toBe(true);
  });

  it('should identify 10-value pairs', () => {
    expect(isPair([card('10'), card('10')])).toBe(true);
    expect(isPair([card('10'), card('J')])).toBe(true);
    expect(isPair([card('J'), card('Q')])).toBe(true);
    expect(isPair([card('Q'), card('K')])).toBe(true);
    expect(isPair([card('K'), card('10')])).toBe(true);
  });

  it('should not identify non-pairs', () => {
    expect(isPair([card('8'), card('9')])).toBe(false);
    expect(isPair([card('A'), card('K')])).toBe(false);
    expect(isPair([card('7'), card('9')])).toBe(false);
  });

  it('should only work with exactly 2 cards', () => {
    expect(isPair([card('8')])).toBe(false);
    expect(isPair([card('8'), card('8'), card('8')])).toBe(false);
  });
});

describe('isBlackjack', () => {
  it('should identify natural blackjack', () => {
    expect(isBlackjack([card('A'), card('K')])).toBe(true);
    expect(isBlackjack([card('A'), card('Q')])).toBe(true);
    expect(isBlackjack([card('A'), card('J')])).toBe(true);
    expect(isBlackjack([card('A'), card('10')])).toBe(true);
  });

  it('should not identify 21 with more than 2 cards as blackjack', () => {
    expect(isBlackjack([card('7'), card('7'), card('7')])).toBe(false);
    expect(isBlackjack([card('5'), card('6'), card('10')])).toBe(false);
  });

  it('should not identify non-21 as blackjack', () => {
    expect(isBlackjack([card('10'), card('9')])).toBe(false);
  });
});

describe('isBusted', () => {
  it('should identify busted hands', () => {
    expect(isBusted([card('K'), card('Q'), card('5')])).toBe(true);
    expect(isBusted([card('10'), card('10'), card('10')])).toBe(true);
  });

  it('should not identify non-busted hands', () => {
    expect(isBusted([card('10'), card('10')])).toBe(false);
    expect(isBusted([card('A'), card('K')])).toBe(false);
    expect(isBusted([card('7'), card('7'), card('7')])).toBe(false); // 21
  });

  it('should handle soft hands correctly', () => {
    expect(isBusted([card('A'), card('5')])).toBe(false);
    expect(isBusted([card('A'), card('A'), card('9')])).toBe(false); // Soft 21
  });
});

describe('createHand', () => {
  it('should create a hand with correct properties', () => {
    const hand = createHand([card('K'), card('Q')]);
    expect(hand.total).toBe(20);
    expect(hand.isSoft).toBe(false);
    expect(hand.isPair).toBe(true);
    expect(hand.isBlackjack).toBe(false);
    expect(hand.isBusted).toBe(false);
    expect(hand.isComplete).toBe(false);
  });

  it('should identify blackjack hands', () => {
    const hand = createHand([card('A'), card('K')]);
    expect(hand.isBlackjack).toBe(true);
    expect(hand.total).toBe(21);
  });

  it('should track split status', () => {
    const hand = createHand([card('8'), card('3')], true);
    expect(hand.isFromSplit).toBe(true);
  });
});

describe('getHandKey', () => {
  it('should generate correct key for pairs', () => {
    expect(getHandKey([card('8'), card('8')])).toBe('PAIR_88');
    expect(getHandKey([card('A'), card('A')])).toBe('PAIR_AA');
    expect(getHandKey([card('9'), card('9')])).toBe('PAIR_99');
  });

  it('should generate correct key for 10-value pairs', () => {
    expect(getHandKey([card('10'), card('J')])).toBe('PAIR_1010');
    expect(getHandKey([card('K'), card('Q')])).toBe('PAIR_1010');
  });

  it('should generate correct key for soft hands', () => {
    expect(getHandKey([card('A'), card('7')])).toBe('SOFT_A7');
    expect(getHandKey([card('A'), card('6')])).toBe('SOFT_A6');
    expect(getHandKey([card('A'), card('2')])).toBe('SOFT_A2');
  });

  it('should generate correct key for soft hands with more than 2 cards', () => {
    // Bug fix: 2+5+A should be SOFT_A7 (soft 18), not SOFT_A2
    expect(getHandKey([card('2'), card('5'), card('A')])).toBe('SOFT_A7');
    expect(getHandKey([card('3'), card('4'), card('A')])).toBe('SOFT_A7');
    expect(getHandKey([card('2'), card('2'), card('2'), card('A')])).toBe('SOFT_A6');
  });

  it('should generate correct key for hard hands', () => {
    expect(getHandKey([card('10'), card('2')])).toBe('HARD_12');
    expect(getHandKey([card('9'), card('7')])).toBe('HARD_16');
    // Note: K,Q is a pair (both 10-value), so use non-pair for hard 20
    expect(getHandKey([card('10'), card('9'), card('A')])).toBe('HARD_20');
  });
});
