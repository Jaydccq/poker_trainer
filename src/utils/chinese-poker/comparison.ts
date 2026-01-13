/**
 * Hand comparison logic for Chinese Poker
 * Handles comparison between different hand sizes and constraint validation
 */

import { Card } from '@/poker/solver/cards';
import {
  evaluateThreeCardHand,
  compareThreeCardHands
} from './hand-3card';
import {
  evaluateFiveCardHand,
  compareFiveCardHands
} from './hand-5card';
import {
  ThreeCardHandValue,
  FiveCardHandValue,
  FiveCardRank
} from '@/types/chinese-poker';

/**
 * Check if back hand is stronger than or equal to middle hand
 * This is a constraint check for valid Chinese Poker arrangements
 */
export function isBackStrongerThanMiddle(
  backCards: Card[],
  middleCards: Card[]
): boolean {
  const backValue = evaluateFiveCardHand(backCards);
  const middleValue = evaluateFiveCardHand(middleCards);

  return compareFiveCardHands(backValue, middleValue) >= 0;
}

/**
 * Check if middle hand is stronger than or equal to front hand
 * Special rule: A 5-card hand always beats a 3-card hand of "similar" type
 *
 * For example:
 * - Middle with pair 2-2 beats Front with pair A-A
 * - Middle with high card K beats Front with high card A
 *
 * The only way front can be stronger is if it has a higher "tier":
 * - Front trips beats Middle pair
 * - Front pair beats Middle high card
 */
export function isMiddleStrongerThanFront(
  middleCards: Card[],
  frontCards: Card[]
): boolean {
  const middleValue = evaluateFiveCardHand(middleCards);
  const frontValue = evaluateThreeCardHand(frontCards);

  return isMiddleHandStrongerThanFrontHand(middleValue, frontValue);
}

/**
 * Compare evaluated middle hand vs evaluated front hand
 */
export function isMiddleHandStrongerThanFrontHand(
  middle: FiveCardHandValue,
  front: ThreeCardHandValue
): boolean {
  // Map three-card ranks to comparable levels
  // THREE_OF_A_KIND (2) ~= TWO_PAIR (2) in five-card
  // PAIR (1) ~= HIGH_CARD (0) in five-card for Chinese Poker rules

  // If middle has two pair or better, it always beats front
  if (middle.rank >= FiveCardRank.TWO_PAIR) {
    return true;
  }

  // If middle has one pair
  if (middle.rank === FiveCardRank.ONE_PAIR) {
    // Front trips beats middle pair
    if (front.rank === 2) { // THREE_OF_A_KIND
      return false;
    }
    // Middle pair always beats front pair or high card
    return true;
  }

  // Middle is high card
  // Front trips or pair beats middle high card
  if (front.rank >= 1) { // PAIR or better
    return false;
  }

  // Both are high card - middle always wins
  return true;
}

/**
 * Compare two 3-card hands directly
 */
export function compareFrontHands(
  hand1Cards: Card[],
  hand2Cards: Card[]
): number {
  const hand1 = evaluateThreeCardHand(hand1Cards);
  const hand2 = evaluateThreeCardHand(hand2Cards);
  return compareThreeCardHands(hand1, hand2);
}

/**
 * Compare two 5-card hands directly (for middle or back)
 */
export function compareFiveCardHands_Direct(
  hand1Cards: Card[],
  hand2Cards: Card[]
): number {
  const hand1 = evaluateFiveCardHand(hand1Cards);
  const hand2 = evaluateFiveCardHand(hand2Cards);
  return compareFiveCardHands(hand1, hand2);
}
