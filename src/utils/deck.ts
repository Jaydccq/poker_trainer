import { Card, Suit, Rank } from "@/types";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const RANK_VALUES: Record<Rank, number> = {
  A: 11,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 10,
  Q: 10,
  K: 10,
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

export function createShoe(numDecks: number, seed?: number): Card[] {
  const shoe: Card[] = [];

  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck());
  }

  return shuffle(shoe, seed);
}

export function shuffle(cards: Card[], seed?: number): Card[] {
  const shuffled = [...cards];

  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function seededRandom(seed: number): () => number {
  let current = seed;
  return () => {
    current = (current * 1103515245 + 12345) & 0x7fffffff;
    return current / 0x7fffffff;
  };
}

export function dealCard(shoe: Card[]): Card | undefined {
  return shoe.pop();
}
