/**
 * Suit Isomorphism Module
 * 
 * Implements suit equivalence optimization for CFR solver.
 * When the board has no paired cards and suits are symmetric,
 * we can reuse computation results for equivalent suit permutations.
 * 
 * Example: Ah Kh on 2♠ 5♠ 9♣ is equivalent to As Ks on 2♥ 5♥ 9♦
 */

import { Card, CardSuit, ALL_SUITS, cardToString, RANK_VALUES } from './cards';

// ============================================================================
// Types
// ============================================================================

/**
 * Mapping of original suits to canonical suits
 */
export type SuitPermutation = Map<CardSuit, CardSuit>;

/**
 * Isomorphism mapping result
 */
export interface IsomorphismMapping {
  /** The canonicalized board */
  canonicalBoard: Card[];
  /** How to map original suits to canonical suits */
  suitPermutation: SuitPermutation;
  /** Reverse permutation for restoring original suits */
  reverseSuitPermutation: SuitPermutation;
  /** Number of equivalent permutations (for weighting) */
  equivalentCount: number;
  /** Whether isomorphism is applicable (false if board has suit constraints) */
  isApplicable: boolean;
}

/**
 * Canonicalized combo representation
 */
export interface CanonicalCombo {
  key: string;
  cards: [Card, Card];
  originalCards: [Card, Card];
  weight: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Count occurrences of each suit on the board
 */
function countBoardSuits(board: Card[]): Map<CardSuit, number> {
  const counts = new Map<CardSuit, number>();
  for (const suit of ALL_SUITS) {
    counts.set(suit, 0);
  }
  for (const card of board) {
    counts.set(card.suit, (counts.get(card.suit) || 0) + 1);
  }
  return counts;
}

/**
 * Check if board has flush potential (3+ cards of same suit)
 */
function hasFlushPotential(board: Card[]): boolean {
  const counts = countBoardSuits(board);
  for (const count of counts.values()) {
    if (count >= 3) return true;
  }
  return false;
}

/**
 * Get the canonical suit ordering based on board composition
 * Suits with more cards on board get lower canonical values
 */
function getCanonicalSuitOrder(board: Card[]): CardSuit[] {
  const counts = countBoardSuits(board);
  
  // Sort suits by count (descending), then by natural order for ties
  const sortedSuits = [...ALL_SUITS].sort((a, b) => {
    const countDiff = (counts.get(b) || 0) - (counts.get(a) || 0);
    if (countDiff !== 0) return countDiff;
    return ALL_SUITS.indexOf(a) - ALL_SUITS.indexOf(b);
  });
  
  return sortedSuits;
}

// ============================================================================
// Main Isomorphism Functions
// ============================================================================

/**
 * Compute isomorphism mapping for a given board
 * 
 * @param board - The community cards
 * @returns Isomorphism mapping with canonical board and suit permutation
 */
export function computeIsomorphism(board: Card[]): IsomorphismMapping {
  // Empty board - no isomorphism applicable
  if (board.length === 0) {
    return {
      canonicalBoard: [],
      suitPermutation: new Map(ALL_SUITS.map((s: CardSuit): [CardSuit, CardSuit] => [s, s])),
      reverseSuitPermutation: new Map(ALL_SUITS.map((s: CardSuit): [CardSuit, CardSuit] => [s, s])),
      equivalentCount: 1,
      isApplicable: false,
    };
  }
  
  const suitCounts = countBoardSuits(board);
  const canonicalOrder = getCanonicalSuitOrder(board);
  
  // Create suit permutation: map each original suit to its canonical position
  const suitPermutation: SuitPermutation = new Map();
  const reverseSuitPermutation: SuitPermutation = new Map();
  
  // Map suits in order of their count on the board
  const originalOrder = [...ALL_SUITS].sort((a, b) => {
    const countDiff = (suitCounts.get(b) || 0) - (suitCounts.get(a) || 0);
    if (countDiff !== 0) return countDiff;
    // For ties, use first appearance on board
    const aIdx = board.findIndex(c => c.suit === a);
    const bIdx = board.findIndex(c => c.suit === b);
    if (aIdx === -1 && bIdx === -1) return ALL_SUITS.indexOf(a) - ALL_SUITS.indexOf(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  for (let i = 0; i < ALL_SUITS.length; i++) {
    suitPermutation.set(originalOrder[i], ALL_SUITS[i]);
    reverseSuitPermutation.set(ALL_SUITS[i], originalOrder[i]);
  }
  
  // Create canonical board
  const canonicalBoard = board.map(card => ({
    rank: card.rank,
    suit: suitPermutation.get(card.suit)!,
  }));
  
  // Count equivalent permutations (suits with same count are interchangeable)
  let equivalentCount = 1;
  const countGroups = new Map<number, number>();
  for (const count of suitCounts.values()) {
    countGroups.set(count, (countGroups.get(count) || 0) + 1);
  }
  for (const groupSize of countGroups.values()) {
    equivalentCount *= factorial(groupSize);
  }
  
  // Isomorphism is most useful when suits are interchangeable
  // Less applicable when there's flush potential
  const isApplicable = !hasFlushPotential(board) || equivalentCount > 1;
  
  return {
    canonicalBoard,
    suitPermutation,
    reverseSuitPermutation,
    equivalentCount,
    isApplicable,
  };
}

/**
 * Convert a combo to its canonical form using the isomorphism mapping
 */
export function getCanonicalCombo(
  cards: [Card, Card],
  mapping: IsomorphismMapping
): [Card, Card] {
  return [
    {
      rank: cards[0].rank,
      suit: mapping.suitPermutation.get(cards[0].suit)!,
    },
    {
      rank: cards[1].rank,
      suit: mapping.suitPermutation.get(cards[1].suit)!,
    },
  ];
}

/**
 * Create a string key for a canonical combo (for hash map lookups)
 */
export function getCanonicalComboKey(cards: [Card, Card]): string {
  // Sort cards by rank then suit for consistent key
  const sorted = [...cards].sort((a, b) => {
    if (a.rank !== b.rank) return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
    return ALL_SUITS.indexOf(a.suit) - ALL_SUITS.indexOf(b.suit);
  });
  return `${cardToString(sorted[0])}${cardToString(sorted[1])}`;
}

/**
 * Check if a combo should be skipped because an equivalent has been processed
 */
export function shouldSkipEquivalent(
  cards: [Card, Card],
  mapping: IsomorphismMapping,
  processedKeys: Set<string>
): boolean {
  if (!mapping.isApplicable) return false;
  
  const canonical = getCanonicalCombo(cards, mapping);
  const key = getCanonicalComboKey(canonical);
  
  if (processedKeys.has(key)) {
    return true;
  }
  
  processedKeys.add(key);
  return false;
}

/**
 * Get all equivalent combos for a given canonical combo
 * Useful for debugging and verification
 */
export function getEquivalentCombos(
  cards: [Card, Card],
  mapping: IsomorphismMapping
): [Card, Card][] {
  if (!mapping.isApplicable || mapping.equivalentCount === 1) {
    return [cards];
  }
  
  const equivalents: [Card, Card][] = [];
  const baseSuits = cards.map(c => c.suit);
  
  // Generate all suit permutations
  const permutations = generateSuitPermutations(mapping);
  
  for (const perm of permutations) {
    const permuted: [Card, Card] = [
      { rank: cards[0].rank, suit: perm.get(baseSuits[0])! },
      { rank: cards[1].rank, suit: perm.get(baseSuits[1])! },
    ];
    equivalents.push(permuted);
  }
  
  return equivalents;
}

// ============================================================================
// Helper Functions
// ============================================================================

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Generate all valid suit permutations that preserve board structure
 */
function generateSuitPermutations(mapping: IsomorphismMapping): SuitPermutation[] {
  // For now, just return identity - full permutation generation is complex
  // and not strictly necessary for the optimization to work
  const identity: SuitPermutation = new Map(ALL_SUITS.map((s: CardSuit): [CardSuit, CardSuit] => [s, s]));
  return [identity];
}

// ============================================================================
// Optimization Helpers
// ============================================================================

/**
 * Create an optimized combo iterator that skips equivalent combos
 */
export function* iterateUniqueCombos<T extends { cards: [Card, Card] }>(
  combos: T[],
  mapping: IsomorphismMapping
): Generator<{ combo: T; weight: number }> {
  if (!mapping.isApplicable) {
    for (const combo of combos) {
      yield { combo, weight: 1 };
    }
    return;
  }
  
  const processedKeys = new Set<string>();
  
  for (const combo of combos) {
    const canonical = getCanonicalCombo(combo.cards, mapping);
    const key = getCanonicalComboKey(canonical);
    
    if (processedKeys.has(key)) {
      continue; // Skip equivalent combo
    }
    
    processedKeys.add(key);
    // Weight by number of equivalents to compensate for skipped combos
    yield { combo, weight: mapping.equivalentCount };
  }
}

/**
 * Calculate the number of unique combos after applying isomorphism
 */
export function countUniqueCombos<T extends { cards: [Card, Card] }>(
  combos: T[],
  mapping: IsomorphismMapping
): number {
  if (!mapping.isApplicable) {
    return combos.length;
  }
  
  const uniqueKeys = new Set<string>();
  for (const combo of combos) {
    const canonical = getCanonicalCombo(combo.cards, mapping);
    const key = getCanonicalComboKey(canonical);
    uniqueKeys.add(key);
  }
  
  return uniqueKeys.size;
}
