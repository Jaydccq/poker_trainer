/**
 * Valid arrangement generator with pruning for Chinese Poker
 * Generates all valid 3-5-5 splits that satisfy Back >= Middle >= Front
 */

import { Card, cardToString } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  evaluateFiveCardHand,
  compareFiveCardHands
} from './hand-5card';
import { isMiddleHandStrongerThanFrontHand } from './comparison';
import { evaluateThreeCardHand } from './hand-3card';

/**
 * Generator options
 */
export interface GeneratorOptions {
  maxArrangements?: number;  // Limit output (default: all valid)
  pruningStrategy?: 'aggressive' | 'conservative';  // How aggressively to prune
}

/**
 * Generate all valid arrangements for a 13-card hand
 * Uses recursive backtracking with pruning at each level
 *
 * Algorithm:
 * 1. Choose back hand (C(13, 5) = 1,287 combinations)
 * 2. For each back, choose middle (C(8, 5) = 56 combinations)
 *    - Prune if middle > back
 * 3. For each valid back+middle, front is remaining 3 cards
 *    - Prune if front > middle
 */
export function generateValidArrangements(
  cards: Card[],
  options?: GeneratorOptions
): Arrangement[] {
  if (cards.length !== 13) {
    throw new Error('Must provide exactly 13 cards');
  }

  const valid: Arrangement[] = [];
  const maxCount = options?.maxArrangements ?? Infinity;

  // Generate all 5-card combinations for back hand
  const backCombos = getCombinations(cards, 5);

  for (const back of backCombos) {
    // Early pruning: skip obviously weak backs (optional aggressive strategy)
    if (options?.pruningStrategy === 'aggressive' && isTooWeakForBack(back)) {
      continue;
    }

    const backValue = evaluateFiveCardHand(back);

    // Get remaining 8 cards
    const remaining8 = cards.filter(c => !cardInArray(c, back));

    // Generate all 5-card combinations for middle hand
    const middleCombos = getCombinations(remaining8, 5);

    for (const middle of middleCombos) {
      const middleValue = evaluateFiveCardHand(middle);

      // Constraint check: back >= middle
      if (compareFiveCardHands(backValue, middleValue) < 0) {
        continue; // Prune this branch
      }

      // Front is remaining 3 cards
      const front = remaining8.filter(c => !cardInArray(c, middle));

      const frontValue = evaluateThreeCardHand(front);

      // Constraint check: middle >= front (special rules)
      if (!isMiddleHandStrongerThanFrontHand(middleValue, frontValue)) {
        continue; // Prune
      }

      // Valid arrangement found!
      valid.push({ front, middle, back });

      // Check if we've reached the limit
      if (valid.length >= maxCount) {
        return valid;
      }
    }
  }

  return valid;
}

/**
 * Count valid arrangements without generating them all
 * Useful for checking if any valid arrangement exists
 */
export function countValidArrangements(cards: Card[]): number {
  let count = 0;

  const backCombos = getCombinations(cards, 5);

  for (const back of backCombos) {
    const backValue = evaluateFiveCardHand(back);
    const remaining8 = cards.filter(c => !cardInArray(c, back));
    const middleCombos = getCombinations(remaining8, 5);

    for (const middle of middleCombos) {
      const middleValue = evaluateFiveCardHand(middle);

      if (compareFiveCardHands(backValue, middleValue) < 0) {
        continue;
      }

      const front = remaining8.filter(c => !cardInArray(c, middle));
      const frontValue = evaluateThreeCardHand(front);

      if (isMiddleHandStrongerThanFrontHand(middleValue, frontValue)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Check if at least one valid arrangement exists
 * Faster than generating all arrangements
 */
export function hasValidArrangement(cards: Card[]): boolean {
  const arrangements = generateValidArrangements(cards, { maxArrangements: 1 });
  return arrangements.length > 0;
}

/**
 * Generate combinations of size k from array
 * Using iterative approach for better performance
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr];

  const result: T[][] = [];
  const indices = Array.from({ length: k }, (_, i) => i);

  while (true) {
    // Add current combination
    result.push(indices.map(i => arr[i]));

    // Find rightmost index that can be incremented
    let i = k - 1;
    while (i >= 0 && indices[i] === arr.length - k + i) {
      i--;
    }

    // No more combinations
    if (i < 0) break;

    // Increment this index and reset all to its right
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }

  return result;
}

/**
 * Check if a card exists in array
 */
function cardInArray(card: Card, arr: Card[]): boolean {
  const cardStr = cardToString(card);
  return arr.some(c => cardToString(c) === cardStr);
}

/**
 * Aggressive pruning: check if back hand is too weak
 * Only used when pruningStrategy is 'aggressive'
 *
 * A back hand is considered "too weak" if it's likely to result in a foul
 * For example: high card or single pair might be too weak
 */
function isTooWeakForBack(back: Card[]): boolean {
  const backValue = evaluateFiveCardHand(back);

  // If back is just high card or one pair, it's likely too weak
  // (might cause foul when trying to arrange middle/front)
  // This is a heuristic - can be adjusted based on testing
  return backValue.rank <= 1; // HIGH_CARD (0) or ONE_PAIR (1)
}

/**
 * Get statistics about arrangement generation
 */
export interface ArrangementStats {
  totalTheoretical: number;  // C(13,3) * C(10,5) = 72,072
  totalValid: number;
  validPercentage: number;
}

export function getArrangementStats(cards: Card[]): ArrangementStats {
  const totalValid = countValidArrangements(cards);
  const totalTheoretical = 72072; // C(13,3) * C(10,5) * C(5,5)

  return {
    totalTheoretical,
    totalValid,
    validPercentage: (totalValid / totalTheoretical) * 100
  };
}
