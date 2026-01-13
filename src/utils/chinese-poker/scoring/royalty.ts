/**
 * Royalty (bonus) system for Chinese Poker
 * Awards bonus points for strong hands in each row
 */

import { Card } from '@/poker/solver/cards';
import { evaluateThreeCardHand } from '../hand-3card';
import { evaluateFiveCardHand } from '../hand-5card';
import { ThreeCardRank, FiveCardRank } from '@/types/chinese-poker';

/**
 * Royalty bonus result
 */
export interface RoyaltyResult {
  front: number;
  middle: number;
  back: number;
  total: number;
}

/**
 * Calculate royalty for front row (3-card hand)
 * Standard royalties:
 * - 6-6: 1 point
 * - 7-7: 2 points
 * - 8-8: 3 points
 * - 9-9: 4 points
 * - T-T: 5 points
 * - J-J: 6 points
 * - Q-Q: 7 points
 * - K-K: 8 points
 * - A-A: 9 points
 * - Trips 2-2-2: 10 points
 * - Trips 3-3-3: 11 points
 * - ... up to trips A-A-A: 22 points
 */
export function calculateFrontRoyalty(cards: Card[]): number {
  if (cards.length !== 3) return 0;

  const hand = evaluateThreeCardHand(cards);

  // High card or pair below 6-6: no royalty
  if (hand.rank === ThreeCardRank.HIGH_CARD) {
    return 0;
  }

  if (hand.rank === ThreeCardRank.PAIR) {
    // Pair royalties: 6-6 = 1, 7-7 = 2, ..., A-A = 9
    // hand.primaryValue: 0 (2s) to 12 (As)
    // 6-6 is value 4, A-A is value 12
    if (hand.primaryValue < 4) {
      return 0; // Pairs below 6-6
    }
    return hand.primaryValue - 3; // 6-6 (4) = 1, 7-7 (5) = 2, ..., A-A (12) = 9
  }

  if (hand.rank === ThreeCardRank.THREE_OF_A_KIND) {
    // Trips royalties: 2-2-2 = 10, 3-3-3 = 11, ..., A-A-A = 22
    return hand.primaryValue + 10;
  }

  return 0;
}

/**
 * Calculate royalty for middle row (5-card hand)
 * Standard royalties:
 * - Three of a kind: 2 points
 * - Straight: 4 points
 * - Flush: 8 points
 * - Full house: 12 points
 * - Four of a kind: 20 points
 * - Straight flush: 30 points
 * - Royal flush: 50 points
 */
export function calculateMiddleRoyalty(cards: Card[]): number {
  if (cards.length !== 5) return 0;

  const hand = evaluateFiveCardHand(cards);

  switch (hand.rank) {
    case FiveCardRank.THREE_OF_A_KIND:
      return 2;

    case FiveCardRank.STRAIGHT:
      return 4;

    case FiveCardRank.FLUSH:
      return 8;

    case FiveCardRank.FULL_HOUSE:
      return 12;

    case FiveCardRank.FOUR_OF_A_KIND:
      return 20;

    case FiveCardRank.STRAIGHT_FLUSH:
      return 30;

    case FiveCardRank.ROYAL_FLUSH:
      return 50;

    default:
      return 0;
  }
}

/**
 * Calculate royalty for back row (5-card hand)
 * Standard royalties (same as middle but less common):
 * - Four of a kind: 10 points
 * - Straight flush: 15 points
 * - Royal flush: 25 points
 */
export function calculateBackRoyalty(cards: Card[]): number {
  if (cards.length !== 5) return 0;

  const hand = evaluateFiveCardHand(cards);

  switch (hand.rank) {
    case FiveCardRank.FOUR_OF_A_KIND:
      return 10;

    case FiveCardRank.STRAIGHT_FLUSH:
      return 15;

    case FiveCardRank.ROYAL_FLUSH:
      return 25;

    default:
      return 0;
  }
}

/**
 * Calculate total royalty for an arrangement
 */
export function calculateRoyalty(
  front: Card[],
  middle: Card[],
  back: Card[]
): RoyaltyResult {
  const frontRoyalty = calculateFrontRoyalty(front);
  const middleRoyalty = calculateMiddleRoyalty(middle);
  const backRoyalty = calculateBackRoyalty(back);

  return {
    front: frontRoyalty,
    middle: middleRoyalty,
    back: backRoyalty,
    total: frontRoyalty + middleRoyalty + backRoyalty
  };
}
