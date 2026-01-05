/**
 * Card representation and manipulation for poker solver
 * Based on TexasHoldem card representations
 */

export type CardRank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type CardSuit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

/**
 * Ranks ordered by value (2 = 0, A = 12)
 */
export const RANK_VALUES: Record<CardRank, number> = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
  '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
};

export const RANKS_BY_VALUE: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const ALL_SUITS: CardSuit[] = ['s', 'h', 'd', 'c'];
export const SUIT_NAMES: Record<CardSuit, string> = {
  's': 'Spades', 'h': 'Hearts', 'd': 'Diamonds', 'c': 'Clubs'
};

/**
 * Convert card to integer (0-51)
 * 0-12 = Clubs (2-A), 13-25 = Diamonds, 26-38 = Hearts, 39-51 = Spades
 */
export function cardToInt(card: Card): number {
  const rankVal = RANK_VALUES[card.rank];
  const suitVal = ALL_SUITS.indexOf(card.suit);
  return suitVal * 13 + rankVal;
}

/**
 * Convert integer (0-51) to card
 */
export function intToCard(n: number): Card {
  const suit = ALL_SUITS[Math.floor(n / 13)];
  const rank = RANKS_BY_VALUE[n % 13];
  return { rank, suit };
}

/**
 * Parse card string like "As", "Kh", "2c"
 */
export function parseCard(str: string): Card | null {
  if (str.length !== 2) return null;
  
  const rank = str[0].toUpperCase() as CardRank;
  const suit = str[1].toLowerCase() as CardSuit;
  
  if (!RANK_VALUES.hasOwnProperty(rank) || !ALL_SUITS.includes(suit)) {
    return null;
  }
  
  return { rank, suit };
}

/**
 * Convert card to string like "As", "Kh"
 */
export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/**
 * Get 64-bit bitmask for a card (for conflict detection)
 */
export function getCardBitmask(card: Card): bigint {
  return BigInt(1) << BigInt(cardToInt(card));
}

/**
 * Get combined bitmask for multiple cards
 */
export function getCardsBitmask(cards: Card[]): bigint {
  let mask = BigInt(0);
  for (const card of cards) {
    mask |= getCardBitmask(card);
  }
  return mask;
}

/**
 * Check if two cards are the same
 */
export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/**
 * Check if a card exists in an array
 */
export function cardInArray(card: Card, arr: Card[]): boolean {
  return arr.some(c => cardsEqual(c, card));
}

/**
 * Generate all 52 cards
 */
export function getAllCards(): Card[] {
  const cards: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of RANKS_BY_VALUE) {
      cards.push({ rank, suit });
    }
  }
  return cards;
}

/**
 * Get remaining cards not in the given set
 */
export function getRemainingCards(usedCards: Card[]): Card[] {
  const all = getAllCards();
  return all.filter(c => !cardInArray(c, usedCards));
}

/**
 * Get all combos for a hand notation with specific board
 * Handles card blocking
 */
export function getHandCombos(
  notation: string,
  blockedCards: Card[] = []
): [Card, Card][] {
  const combos: [Card, Card][] = [];
  const blockedMask = getCardsBitmask(blockedCards);
  
  if (notation.length === 2 && notation[0] === notation[1]) {
    // Pocket pair
    const rank = notation[0] as CardRank;
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const c1: Card = { rank, suit: ALL_SUITS[i] };
        const c2: Card = { rank, suit: ALL_SUITS[j] };
        const mask = getCardBitmask(c1) | getCardBitmask(c2);
        if ((mask & blockedMask) === BigInt(0)) {
          combos.push([c1, c2]);
        }
      }
    }
  } else if (notation.endsWith('s')) {
    // Suited
    const r1 = notation[0] as CardRank;
    const r2 = notation[1] as CardRank;
    for (const suit of ALL_SUITS) {
      const c1: Card = { rank: r1, suit };
      const c2: Card = { rank: r2, suit };
      const mask = getCardBitmask(c1) | getCardBitmask(c2);
      if ((mask & blockedMask) === BigInt(0)) {
        combos.push([c1, c2]);
      }
    }
  } else {
    // Offsuit
    const r1 = notation[0] as CardRank;
    const r2 = notation[1] as CardRank;
    for (const suit1 of ALL_SUITS) {
      for (const suit2 of ALL_SUITS) {
        if (suit1 === suit2) continue;
        const c1: Card = { rank: r1, suit: suit1 };
        const c2: Card = { rank: r2, suit: suit2 };
        const mask = getCardBitmask(c1) | getCardBitmask(c2);
        if ((mask & blockedMask) === BigInt(0)) {
          combos.push([c1, c2]);
        }
      }
    }
  }
  
  return combos;
}

/**
 * Get the number of unblocked combos for a hand
 */
export function countUnblockedCombos(notation: string, blockedCards: Card[] = []): number {
  return getHandCombos(notation, blockedCards).length;
}
