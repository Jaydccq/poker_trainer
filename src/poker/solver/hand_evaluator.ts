/**
 * 5-card hand evaluator for Texas Hold'em
 * Returns comparable hand strength values
 */

import { Card, RANK_VALUES, CardRank } from './cards';

/**
 * Hand rankings (higher = better)
 */
export enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

/**
 * Hand evaluation result
 */
export interface HandEvaluation {
  rank: HandRank;
  value: number; // Comparable value within same rank
  description: string;
  cards: Card[]; // Best 5 cards
}

/**
 * Evaluate a 5-7 card hand, returning best 5-card hand strength
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate');
  }
  
  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }
  
  // Find best 5-card combination
  let best: HandEvaluation | null = null;
  const combos = getCombinations(cards, 5);
  
  for (const combo of combos) {
    const evaluation = evaluate5Cards(combo);
    if (!best || compareHands(evaluation, best) > 0) {
      best = evaluation;
    }
  }
  
  return best!;
}

/**
 * Evaluate exactly 5 cards
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  const rankCounts = getRankCounts(cards);
  const suitCounts = getSuitCounts(cards);
  const sortedRanks = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: rank as CardRank, count }))
    .sort((a, b) => b.count - a.count || RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  
  const isFlush = Object.values(suitCounts).some(c => c >= 5);
  const straightInfo = getStraightInfo(rankCounts);
  
  // Royal Flush
  if (isFlush && straightInfo.isStraight && straightInfo.high === 12) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      value: 0,
      description: 'Royal Flush',
      cards
    };
  }
  
  // Straight Flush
  if (isFlush && straightInfo.isStraight) {
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      value: straightInfo.high,
      description: `Straight Flush, ${getRankName(straightInfo.high)} high`,
      cards
    };
  }
  
  // Four of a Kind
  if (sortedRanks[0].count === 4) {
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      value: RANK_VALUES[sortedRanks[0].rank] * 13 + RANK_VALUES[sortedRanks[1].rank],
      description: `Four of a Kind, ${getRankName(RANK_VALUES[sortedRanks[0].rank])}s`,
      cards
    };
  }
  
  // Full House
  if (sortedRanks[0].count === 3 && sortedRanks[1].count >= 2) {
    return {
      rank: HandRank.FULL_HOUSE,
      value: RANK_VALUES[sortedRanks[0].rank] * 13 + RANK_VALUES[sortedRanks[1].rank],
      description: `Full House, ${getRankName(RANK_VALUES[sortedRanks[0].rank])}s full of ${getRankName(RANK_VALUES[sortedRanks[1].rank])}s`,
      cards
    };
  }
  
  // Flush
  if (isFlush) {
    const flushRanks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
    const value = flushRanks.reduce((v, r, i) => v + r * Math.pow(13, 4 - i), 0);
    return {
      rank: HandRank.FLUSH,
      value,
      description: `Flush, ${getRankName(flushRanks[0])} high`,
      cards
    };
  }
  
  // Straight
  if (straightInfo.isStraight) {
    return {
      rank: HandRank.STRAIGHT,
      value: straightInfo.high,
      description: `Straight, ${getRankName(straightInfo.high)} high`,
      cards
    };
  }
  
  // Three of a Kind
  if (sortedRanks[0].count === 3) {
    const kickers = sortedRanks.slice(1).map(r => RANK_VALUES[r.rank]);
    return {
      rank: HandRank.THREE_OF_A_KIND,
      value: RANK_VALUES[sortedRanks[0].rank] * 169 + kickers[0] * 13 + kickers[1],
      description: `Three of a Kind, ${getRankName(RANK_VALUES[sortedRanks[0].rank])}s`,
      cards
    };
  }
  
  // Two Pair
  if (sortedRanks[0].count === 2 && sortedRanks[1].count === 2) {
    const highPair = Math.max(RANK_VALUES[sortedRanks[0].rank], RANK_VALUES[sortedRanks[1].rank]);
    const lowPair = Math.min(RANK_VALUES[sortedRanks[0].rank], RANK_VALUES[sortedRanks[1].rank]);
    const kicker = RANK_VALUES[sortedRanks[2].rank];
    return {
      rank: HandRank.TWO_PAIR,
      value: highPair * 169 + lowPair * 13 + kicker,
      description: `Two Pair, ${getRankName(highPair)}s and ${getRankName(lowPair)}s`,
      cards
    };
  }
  
  // Pair
  if (sortedRanks[0].count === 2) {
    const kickers = sortedRanks.slice(1).map(r => RANK_VALUES[r.rank]);
    return {
      rank: HandRank.PAIR,
      value: RANK_VALUES[sortedRanks[0].rank] * 2197 + kickers[0] * 169 + kickers[1] * 13 + kickers[2],
      description: `Pair of ${getRankName(RANK_VALUES[sortedRanks[0].rank])}s`,
      cards
    };
  }
  
  // High Card
  const highRanks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const value = highRanks.reduce((v, r, i) => v + r * Math.pow(13, 4 - i), 0);
  return {
    rank: HandRank.HIGH_CARD,
    value,
    description: `High Card, ${getRankName(highRanks[0])}`,
    cards
  };
}

/**
 * Compare two hand evaluations
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }
  return a.value - b.value;
}

/**
 * Get hand value as single number for fast comparison
 */
export function getHandValue(eval_: HandEvaluation): number {
  return eval_.rank * 100000000 + eval_.value;
}

// Helper functions

function getRankCounts(cards: Card[]): Record<CardRank, number> {
  const counts: Partial<Record<CardRank, number>> = {};
  for (const card of cards) {
    counts[card.rank] = (counts[card.rank] || 0) + 1;
  }
  return counts as Record<CardRank, number>;
}

function getSuitCounts(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    counts[card.suit] = (counts[card.suit] || 0) + 1;
  }
  return counts;
}

function getStraightInfo(rankCounts: Record<CardRank, number>): { isStraight: boolean; high: number } {
  const ranks = new Set(Object.keys(rankCounts).map(r => RANK_VALUES[r as CardRank]));
  
  // Check for wheel (A-2-3-4-5)
  if (ranks.has(12) && ranks.has(0) && ranks.has(1) && ranks.has(2) && ranks.has(3)) {
    return { isStraight: true, high: 3 };
  }
  
  // Check for regular straights
  for (let high = 12; high >= 4; high--) {
    let isStraight = true;
    for (let i = 0; i < 5; i++) {
      if (!ranks.has(high - i)) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) {
      return { isStraight: true, high };
    }
  }
  
  return { isStraight: false, high: 0 };
}

function getRankName(value: number): string {
  const names = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  return names[value] || '?';
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  
  const result: T[][] = [];
  const [first, ...rest] = arr;
  
  // Combinations that include first
  const withFirst = getCombinations(rest, size - 1).map(combo => [first, ...combo]);
  
  // Combinations that don't include first
  const withoutFirst = getCombinations(rest, size);
  
  return [...withFirst, ...withoutFirst];
}

/**
 * Quick evaluation for two hands heads-up (returns 1 if hand1 wins, 0.5 tie, 0 loses)
 */
export function compareHandsHeadsUp(
  hand1: Card[],
  hand2: Card[],
  board: Card[]
): number {
  const h1 = evaluateHand([...hand1, ...board]);
  const h2 = evaluateHand([...hand2, ...board]);
  
  const comparison = compareHands(h1, h2);
  if (comparison > 0) return 1;
  if (comparison < 0) return 0;
  return 0.5;
}
