/**
 * Card dealing and deck management for Chinese Poker
 */

import { Card, getAllCards, cardToString } from '@/poker/solver/cards';

/**
 * Player's dealt hand
 */
export interface PlayerHand {
  playerId: string;
  cards: Card[];
}

/**
 * Shuffle cards using Fisher-Yates algorithm
 * If seed is provided, uses seeded random for deterministic results
 */
export function shuffle(cards: Card[], seed?: string): Card[] {
  const shuffled = [...cards];
  const random = seed ? createSeededRandom(seed) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Create a seeded random number generator
 * Simple LCG (Linear Congruential Generator)
 */
function createSeededRandom(seed: string): () => number {
  let state = hashString(seed);

  return () => {
    // LCG parameters (similar to glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a fresh 52-card deck
 */
export function createDeck(): Card[] {
  return getAllCards();
}

/**
 * Deal 13 cards to each player from a shuffled deck
 * Returns array of player hands
 */
export function dealChinesePoker(
  numPlayers: number,
  seed?: string
): PlayerHand[] {
  if (numPlayers < 2 || numPlayers > 4) {
    throw new Error('Chinese Poker requires 2-4 players');
  }

  const deck = createDeck();
  const shuffled = shuffle(deck, seed);

  const hands: PlayerHand[] = [];

  for (let i = 0; i < numPlayers; i++) {
    const playerId = `player_${i}`;
    const cards = shuffled.slice(i * 13, (i + 1) * 13);

    hands.push({
      playerId,
      cards
    });
  }

  return hands;
}

/**
 * Deal specific cards to a player (for testing or specific scenarios)
 */
export function dealSpecificHand(cards: Card[]): PlayerHand {
  if (cards.length !== 13) {
    throw new Error('Chinese Poker requires exactly 13 cards');
  }

  return {
    playerId: 'player_custom',
    cards
  };
}

/**
 * Validate that a set of cards is valid (no duplicates, all from deck)
 */
export function validateCards(cards: Card[]): boolean {
  if (cards.length === 0) return true;

  const seen = new Set<string>();
  const allCards = createDeck();
  const validCardStrings = new Set(allCards.map(cardToString));

  for (const card of cards) {
    const cardStr = cardToString(card);

    // Check if card exists in deck
    if (!validCardStrings.has(cardStr)) {
      return false;
    }

    // Check for duplicates
    if (seen.has(cardStr)) {
      return false;
    }

    seen.add(cardStr);
  }

  return true;
}

/**
 * Check if two sets of cards have any overlap
 */
export function hasCardOverlap(cards1: Card[], cards2: Card[]): boolean {
  const set1 = new Set(cards1.map(cardToString));
  const set2 = new Set(cards2.map(cardToString));

  for (const card of set1) {
    if (set2.has(card)) {
      return true;
    }
  }

  return false;
}

/**
 * Get remaining cards from deck after removing used cards
 */
export function getRemainingDeck(usedCards: Card[]): Card[] {
  const deck = createDeck();
  const usedSet = new Set(usedCards.map(cardToString));

  return deck.filter(card => !usedSet.has(cardToString(card)));
}
