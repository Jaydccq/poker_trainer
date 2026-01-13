export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

// Example usage:
export type HandType = "hard" | "soft" | "pair";

export interface Hand {
  cards: Card[];
  total: number;
  isSoft: boolean;
  isPair: boolean;
  isBlackjack: boolean;
  isBusted: boolean;
  isSurrendered?: boolean;
  isFromSplit: boolean;
  isComplete: boolean;
  bet: number;
}

export type Action =
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "surrender"
  | "insurance";

export interface StrategyRecommendation {
  bestAction: Action;
  reason: {
    zh: string;
    en: string;
  };

  alternativeActions?: Action[];
}

// rule types

export type DealerRule = "S17" | "H17";

export type BlackjackPayout = "3:2" | "6:5";

export interface GameRules {
  decks: number;
  dealerRule: DealerRule;
  blackjackPayout: BlackjackPayout;
  doubleAnyTwoCards: boolean;
  doubleAfterSplit: boolean;
  acesSplitOneCard: boolean;
  lateSurrender: boolean;
  insuranceEnabled: boolean;
  seed?: number;
}

//Game state types

export type GamePhase =
  | "betting"
  | "dealing"
  | "playerTurn"
  | "dealerTurn"
  | "settlement"
  | "results"
  | "insurance";

export type RoundResult = "win" | "lose" | "push" | "blackjack" | "surrender";

export interface GameState {
  shoe: Card[];
  playerHands: Hand[];
  currentHandIndex: number;
  dealerHand: Hand;
  phase: GamePhase;
  result: RoundResult[];

  dealerHoleCardRevealed: boolean;
  
  // Training Mode State
  chipBalance: number;
  currentBet: number;
  runningCount: number;
  trueCount: number;
  justRefilled?: boolean;
}

export interface DecisionRecord {
  timestamp: number;
  rules: GameRules;
  handType: HandType;
  /**  "HARD_12", "SOFT_A7", "PAIR_88" */
  handKey: string;
  dealerUpcard: Rank;
  chosenAction: Action;
  bestAction: Action;
  correct: boolean;
  roundResult?: RoundResult;
}
export interface Statistics {
  totalDecisions: number;
  correctDecisions: number;

  byHandType: {
    hard: { total: number; correct: number };
    soft: { total: number; correct: number };
    pair: { total: number; correct: number };
  };

  topErrors: Array<{
    handKey: string;
    dealerUpcard: Rank;
    errorCount: number;
    lastError: number;
  }>;
}

export type Language = "zh" | "en";
