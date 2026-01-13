/**
 * 5-card hand evaluator for Chinese Poker (middle and back hands)
 * Wraps the existing poker hand evaluator
 */

import { Card } from '@/poker/solver/cards';
import {
  evaluateHand as pokerEvaluateHand,
  HandRank as PokerHandRank,
  compareHands as pokerCompareHands,
  getHandValue as pokerGetHandValue
} from '@/poker/solver/hand_evaluator';
import { FiveCardRank, FiveCardHandValue } from '@/types/chinese-poker';

/**
 * Map poker hand ranks to Chinese Poker five-card ranks
 */
const POKER_TO_CHINESE_RANK: Record<PokerHandRank, FiveCardRank> = {
  [PokerHandRank.HIGH_CARD]: FiveCardRank.HIGH_CARD,
  [PokerHandRank.PAIR]: FiveCardRank.ONE_PAIR,
  [PokerHandRank.TWO_PAIR]: FiveCardRank.TWO_PAIR,
  [PokerHandRank.THREE_OF_A_KIND]: FiveCardRank.THREE_OF_A_KIND,
  [PokerHandRank.STRAIGHT]: FiveCardRank.STRAIGHT,
  [PokerHandRank.FLUSH]: FiveCardRank.FLUSH,
  [PokerHandRank.FULL_HOUSE]: FiveCardRank.FULL_HOUSE,
  [PokerHandRank.FOUR_OF_A_KIND]: FiveCardRank.FOUR_OF_A_KIND,
  [PokerHandRank.STRAIGHT_FLUSH]: FiveCardRank.STRAIGHT_FLUSH,
  [PokerHandRank.ROYAL_FLUSH]: FiveCardRank.ROYAL_FLUSH
};

/**
 * Evaluate a 5-card hand
 */
export function evaluateFiveCardHand(cards: Card[]): FiveCardHandValue {
  if (cards.length !== 5) {
    throw new Error('Must have exactly 5 cards');
  }

  const pokerEval = pokerEvaluateHand(cards);

  return {
    rank: POKER_TO_CHINESE_RANK[pokerEval.rank],
    value: pokerGetHandValue(pokerEval),
    description: pokerEval.description
  };
}

/**
 * Compare two 5-card hands
 * Returns: 1 if hand1 > hand2, -1 if hand1 < hand2, 0 if equal
 */
export function compareFiveCardHands(
  hand1: FiveCardHandValue,
  hand2: FiveCardHandValue
): number {
  // Compare ranks first
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }

  // Same rank, compare values
  if (hand1.value > hand2.value) return 1;
  if (hand1.value < hand2.value) return -1;
  return 0;
}

/**
 * Get numeric value for a 5-card hand (for fast comparison)
 */
export function getFiveCardValue(hand: FiveCardHandValue): number {
  return hand.value;
}
