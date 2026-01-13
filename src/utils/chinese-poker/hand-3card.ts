/**
 * 3-card hand evaluator for Chinese Poker front hand
 */

import { Card, CardRank, RANK_VALUES, RANKS_BY_VALUE } from '@/poker/solver/cards';
import { ThreeCardRank, ThreeCardHandValue } from '@/types/chinese-poker';

/**
 * Evaluate a 3-card hand
 */
export function evaluateThreeCardHand(cards: Card[]): ThreeCardHandValue {
  if (cards.length !== 3) {
    throw new Error('Must have exactly 3 cards');
  }

  const ranks = cards.map(c => c.rank);
  const rankCounts = getRankCounts(ranks);
  const sortedCounts = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: rank as CardRank, count }))
    .sort((a, b) => {
      // Sort by count descending, then by rank value descending
      if (b.count !== a.count) return b.count - a.count;
      return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
    });

  // Three of a Kind
  if (sortedCounts[0].count === 3) {
    const tripRank = sortedCounts[0].rank;
    return {
      rank: ThreeCardRank.THREE_OF_A_KIND,
      primaryValue: RANK_VALUES[tripRank],
      kickers: [],
      description: `Three ${getRankName(tripRank)}s`
    };
  }

  // Pair
  if (sortedCounts[0].count === 2) {
    const pairRank = sortedCounts[0].rank;
    const kicker = sortedCounts[1].rank;
    return {
      rank: ThreeCardRank.PAIR,
      primaryValue: RANK_VALUES[pairRank],
      kickers: [RANK_VALUES[kicker]],
      description: `Pair of ${getRankName(pairRank)}s, ${getRankName(kicker)} kicker`
    };
  }

  // High Card
  const sortedRanks = ranks
    .map(r => RANK_VALUES[r])
    .sort((a, b) => b - a);

  return {
    rank: ThreeCardRank.HIGH_CARD,
    primaryValue: sortedRanks[0],
    kickers: [sortedRanks[1], sortedRanks[2]],
    description: `${getRankName(sortedRanks[0])} high`
  };
}

/**
 * Compare two 3-card hands
 * Returns: 1 if hand1 > hand2, -1 if hand1 < hand2, 0 if equal
 */
export function compareThreeCardHands(
  hand1: ThreeCardHandValue,
  hand2: ThreeCardHandValue
): number {
  // Compare ranks first
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }

  // Same rank, compare primary value
  if (hand1.primaryValue !== hand2.primaryValue) {
    return hand1.primaryValue - hand2.primaryValue;
  }

  // Same primary value, compare kickers
  for (let i = 0; i < Math.min(hand1.kickers.length, hand2.kickers.length); i++) {
    if (hand1.kickers[i] !== hand2.kickers[i]) {
      return hand1.kickers[i] - hand2.kickers[i];
    }
  }

  return 0; // Exact tie
}

/**
 * Get numeric value for a 3-card hand (for fast comparison)
 */
export function getThreeCardValue(hand: ThreeCardHandValue): number {
  let value = hand.rank * 10000 + hand.primaryValue * 100;

  // Add kicker values
  if (hand.kickers.length > 0) {
    value += hand.kickers[0];
  }
  if (hand.kickers.length > 1) {
    value += hand.kickers[1] / 100;
  }

  return value;
}

// Helper functions

function getRankCounts(ranks: CardRank[]): Record<CardRank, number> {
  const counts: Partial<Record<CardRank, number>> = {};
  for (const rank of ranks) {
    counts[rank] = (counts[rank] || 0) + 1;
  }
  return counts as Record<CardRank, number>;
}

function getRankName(rankValue: number | CardRank): string {
  if (typeof rankValue === 'number') {
    return RANKS_BY_VALUE[rankValue];
  }
  return rankValue === 'T' ? '10' : rankValue;
}
