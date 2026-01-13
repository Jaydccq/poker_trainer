/**
 * Arrangement validation and foul detection for Chinese Poker
 */

import { Card, cardToString } from '@/poker/solver/cards';
import {
  Arrangement,
  ArrangementValidation,
  ValidationViolation
} from '@/types/chinese-poker';
import {
  evaluateThreeCardHand,
  compareThreeCardHands
} from './hand-3card';
import {
  evaluateFiveCardHand,
  compareFiveCardHands
} from './hand-5card';
import { isMiddleHandStrongerThanFrontHand } from './comparison';

/**
 * Validate a Chinese Poker arrangement
 * Checks:
 * 1. Correct card counts (3-5-5)
 * 2. No duplicate cards
 * 3. All 13 cards accounted for
 * 4. Back >= Middle >= Front (strength constraint)
 */
export function validateArrangement(
  front: Card[],
  middle: Card[],
  back: Card[]
): ArrangementValidation {
  const violations: ValidationViolation[] = [];

  // Check 1: Card counts
  if (front.length !== 3) {
    violations.push({
      type: 'INVALID_CARD_COUNT',
      message: `Front hand must have exactly 3 cards (has ${front.length})`
    });
  }

  if (middle.length !== 5) {
    violations.push({
      type: 'INVALID_CARD_COUNT',
      message: `Middle hand must have exactly 5 cards (has ${middle.length})`
    });
  }

  if (back.length !== 5) {
    violations.push({
      type: 'INVALID_CARD_COUNT',
      message: `Back hand must have exactly 5 cards (has ${back.length})`
    });
  }

  // If card counts are wrong, can't continue validation
  if (violations.length > 0) {
    return { isValid: false, violations };
  }

  // Check 2: No duplicates across hands
  const allCards = [...front, ...middle, ...back];
  const cardStrings = allCards.map(cardToString);
  const uniqueCards = new Set(cardStrings);

  if (uniqueCards.size !== 13) {
    violations.push({
      type: 'INVALID_CARD_COUNT',
      message: `Found duplicate cards in arrangement (${13 - uniqueCards.size} duplicates)`
    });
    return { isValid: false, violations };
  }

  // Check 3: Strength constraints
  // Back >= Middle
  const backValue = evaluateFiveCardHand(back);
  const middleValue = evaluateFiveCardHand(middle);

  const backVsMiddle = compareFiveCardHands(backValue, middleValue);

  if (backVsMiddle < 0) {
    violations.push({
      type: 'MIDDLE_STRONGER_THAN_BACK',
      message: `Middle hand (${middleValue.description}) is stronger than Back hand (${backValue.description}). Back must be >= Middle.`
    });
  }

  // Middle >= Front (special rules)
  const frontValue = evaluateThreeCardHand(front);

  if (!isMiddleHandStrongerThanFrontHand(middleValue, frontValue)) {
    violations.push({
      type: 'FRONT_STRONGER_THAN_MIDDLE',
      message: `Front hand (${frontValue.description}) is stronger than Middle hand (${middleValue.description}). Middle must be >= Front.`
    });
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Check if an arrangement is a foul (倒水)
 * A foul means the arrangement violates the strength constraint
 */
export function isFoul(arrangement: Arrangement): boolean {
  const validation = validateArrangement(
    arrangement.front,
    arrangement.middle,
    arrangement.back
  );

  return !validation.isValid;
}

/**
 * Get detailed foul reasons
 */
export function getFoulReasons(arrangement: Arrangement): string[] {
  const validation = validateArrangement(
    arrangement.front,
    arrangement.middle,
    arrangement.back
  );

  return validation.violations.map(v => v.message);
}

/**
 * Validate arrangement from a full 13-card hand
 * Ensures all cards are from the original hand
 */
export function validateArrangementFromHand(
  arrangement: Arrangement,
  originalHand: Card[]
): ArrangementValidation {
  const violations: ValidationViolation[] = [];

  // First do basic validation
  const basicValidation = validateArrangement(
    arrangement.front,
    arrangement.middle,
    arrangement.back
  );

  violations.push(...basicValidation.violations);

  // Check that all cards come from original hand
  const arrangedCards = [
    ...arrangement.front,
    ...arrangement.middle,
    ...arrangement.back
  ];

  const arrangedSet = new Set(arrangedCards.map(cardToString));
  const originalSet = new Set(originalHand.map(cardToString));

  // Check each arranged card is in original hand
  for (const cardStr of arrangedSet) {
    if (!originalSet.has(cardStr)) {
      violations.push({
        type: 'INVALID_CARD_COUNT',
        message: `Card ${cardStr} is not in the original hand`
      });
    }
  }

  // Check all original cards are used
  for (const cardStr of originalSet) {
    if (!arrangedSet.has(cardStr)) {
      violations.push({
        type: 'INVALID_CARD_COUNT',
        message: `Card ${cardStr} from original hand is not used in arrangement`
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}
