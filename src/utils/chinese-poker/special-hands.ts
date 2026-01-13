/**
 * Special hands detection for Chinese Poker
 * These are natural hands that score bonus points
 */

import { Card, CardRank, RANK_VALUES } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';

/**
 * Special hand types
 */
export enum SpecialHandType {
  DRAGON = 'DRAGON',           // 一条龙 (straight 2-A across all 13 cards)
  SIX_PAIRS = 'SIX_PAIRS',     // 六对半 (6 pairs + 1 single)
  THREE_FLUSHES = 'THREE_FLUSHES',   // 三同花 (all 3 rows are flushes)
  THREE_STRAIGHTS = 'THREE_STRAIGHTS' // 三顺子 (all 3 rows are straights)
}

/**
 * Special hand detection result
 */
export interface SpecialHandResult {
  type: SpecialHandType | null;
  isValid: boolean;
  points: number; // Bonus points for this special hand
}

/**
 * Check if 13 cards form a Dragon (一条龙)
 * Dragon = straight from 2 to A (one of each rank)
 *
 * Scoring variants:
 * - 1-6 rule: 13 or 26 points (configurable)
 * - Other rules: typically 13 points
 */
export function isDragon(cards: Card[]): boolean {
  if (cards.length !== 13) return false;

  // Check if we have exactly one of each rank (2-A)
  const ranks = cards.map(c => c.rank);
  const uniqueRanks = new Set(ranks);

  // Must have all 13 different ranks
  if (uniqueRanks.size !== 13) return false;

  // Check that all ranks are present
  const expectedRanks: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  for (const rank of expectedRanks) {
    if (!uniqueRanks.has(rank)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if 13 cards form Six Pairs (六对半)
 * Six Pairs = 6 pairs + 1 single card
 *
 * Scoring: typically 3 points
 */
export function isSixPairs(cards: Card[]): boolean {
  if (cards.length !== 13) return false;

  // Count rank occurrences
  const rankCounts = new Map<string, number>();
  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  }

  let pairs = 0;
  let singles = 0;

  for (const count of rankCounts.values()) {
    if (count === 2) {
      pairs++;
    } else if (count === 1) {
      singles++;
    } else {
      return false; // Can't have 3 or 4 of a kind
    }
  }

  return pairs === 6 && singles === 1;
}

/**
 * Check if all three rows are flushes (三同花)
 * Three Flushes = front (3 cards), middle (5 cards), and back (5 cards) are all flushes
 *
 * Note: Front can only be 3 cards, so "flush" means all same suit
 * Scoring: typically 3 points
 */
export function isThreeFlushes(arrangement: Arrangement): boolean {
  const { front, middle, back } = arrangement;

  // Front: all 3 cards same suit
  const frontSuit = front[0].suit;
  const frontFlush = front.every(c => c.suit === frontSuit);

  // Middle: all 5 cards same suit
  const middleSuit = middle[0].suit;
  const middleFlush = middle.every(c => c.suit === middleSuit);

  // Back: all 5 cards same suit
  const backSuit = back[0].suit;
  const backFlush = back.every(c => c.suit === backSuit);

  return frontFlush && middleFlush && backFlush;
}

/**
 * Check if all three rows are straights (三顺子)
 * Three Straights = front (3 cards), middle (5 cards), and back (5 cards) are all straights
 *
 * Note: Front can only be 3 cards, so "straight" means 3 consecutive ranks
 * Scoring: typically 3 points
 */
export function isThreeStraights(arrangement: Arrangement): boolean {
  const { front, middle, back } = arrangement;

  return isStraightHand(front) && isStraightHand(middle) && isStraightHand(back);
}

/**
 * Helper: Check if cards form a straight
 * Works for both 3-card and 5-card hands
 */
function isStraightHand(cards: Card[]): boolean {
  if (cards.length !== 3 && cards.length !== 5) return false;

  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);

  // Check for regular straight
  let isRegularStraight = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      isRegularStraight = false;
      break;
    }
  }

  if (isRegularStraight) return true;

  // Check for wheel (A-2-3-4-5 for 5 cards, A-2-3 for 3 cards)
  // In wheel, Ace is low (value 0)
  if (cards.length === 5) {
    // Check if we have A,2,3,4,5
    const wheelValues = [0, 1, 2, 3, 4]; // A,2,3,4,5
    const sortedValues = [...values].sort((a, b) => a - b);

    // If highest card is Ace (12), check for wheel pattern
    if (sortedValues[4] === 12 &&
        sortedValues[0] === 0 &&
        sortedValues[1] === 1 &&
        sortedValues[2] === 2 &&
        sortedValues[3] === 3) {
      return true;
    }
  } else if (cards.length === 3) {
    // Check for A-2-3 (wheel pattern for 3 cards)
    const sortedValues = [...values].sort((a, b) => a - b);
    if (sortedValues[0] === 0 && sortedValues[1] === 1 && sortedValues[2] === 12) {
      return true;
    }
  }

  return false;
}

/**
 * Detect special hand from 13 cards (before arrangement)
 * Dragon and Six Pairs are detected from the original 13 cards
 */
export function detectSpecialHandFromCards(cards: Card[], defaultPoints = 13): SpecialHandResult {
  // Check Dragon first (higher priority)
  if (isDragon(cards)) {
    return {
      type: SpecialHandType.DRAGON,
      isValid: true,
      points: defaultPoints // Configurable: 13 or 26
    };
  }

  // Check Six Pairs
  if (isSixPairs(cards)) {
    return {
      type: SpecialHandType.SIX_PAIRS,
      isValid: true,
      points: 3
    };
  }

  return {
    type: null,
    isValid: false,
    points: 0
  };
}

/**
 * Detect special hand from arrangement (Three Flushes, Three Straights)
 * These require valid arrangement first
 */
export function detectSpecialHandFromArrangement(arrangement: Arrangement): SpecialHandResult {
  // Check Three Flushes
  if (isThreeFlushes(arrangement)) {
    return {
      type: SpecialHandType.THREE_FLUSHES,
      isValid: true,
      points: 3
    };
  }

  // Check Three Straights
  if (isThreeStraights(arrangement)) {
    return {
      type: SpecialHandType.THREE_STRAIGHTS,
      isValid: true,
      points: 3
    };
  }

  return {
    type: null,
    isValid: false,
    points: 0
  };
}

/**
 * Get all special hands for a given hand and arrangement
 * Returns the highest-scoring special hand
 */
export function getAllSpecialHands(
  cards: Card[],
  arrangement?: Arrangement
): SpecialHandResult {
  // Check card-based special hands first (Dragon > Six Pairs)
  const cardSpecial = detectSpecialHandFromCards(cards);
  if (cardSpecial.isValid) {
    return cardSpecial;
  }

  // If no card-based special hand, check arrangement-based
  if (arrangement) {
    return detectSpecialHandFromArrangement(arrangement);
  }

  return {
    type: null,
    isValid: false,
    points: 0
  };
}
