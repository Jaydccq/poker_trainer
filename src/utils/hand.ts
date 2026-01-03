import { Card, Hand, HandType } from "@/types";

export function calculateTotal(cards: Card[]): {
  total: number;
  isSoft: boolean;
} {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else {
      total += card.value;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  const isSoft = aces > 0;
  return { total, isSoft };
}

export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;

  const { total } = calculateTotal(cards);
  return total === 21;
}
export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;

  // 10, J, Q, K 都算作 10 点的对子
  const getValue = (rank: string) =>
    ["10", "J", "Q", "K"].includes(rank) ? 10 : rank;

  return getValue(cards[0].rank) === getValue(cards[1].rank);
}

export function isBusted(cards: Card[]): boolean {
  const { total } = calculateTotal(cards);
  return total > 21;
}

export function getHandType(cards: Card[]): HandType {
  if (isPair(cards)) return "pair";
  const { isSoft } = calculateTotal(cards);
  return isSoft ? "soft" : "hard";
}

export function createHand(cards: Card[], isFromSplit = false): Hand {
  const { total, isSoft } = calculateTotal(cards);

  return {
    cards,
    total,
    isSoft,
    isPair: isPair(cards),
    isBlackjack: isBlackjack(cards),
    isBusted: isBusted(cards),
    isFromSplit,
    isComplete: false,
    bet: 0,
  };
}
export function getHandKey(cards: Card[]): string {
  const handType = getHandType(cards);
  const { total, isSoft } = calculateTotal(cards);

  if (handType === "pair") {
    const rank = cards[0].rank;
    // 10, J, Q, K 都记作 10
    const pairValue = ["10", "J", "Q", "K"].includes(rank) ? "10" : rank;
    return `PAIR_${pairValue}${pairValue}`;
  }

  if (handType === "soft") {
    // 软手：计算所有非 A 牌的总和
    const nonAceTotal = cards
      .filter((c) => c.rank !== "A")
      .reduce((sum, card) => sum + card.value, 0);
    return `SOFT_A${nonAceTotal || (total - 11)}`;
  }

  return `HARD_${total}`;
}
