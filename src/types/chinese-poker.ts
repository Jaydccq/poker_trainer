/**
 * Type definitions for Chinese Poker (十三水)
 */

import { Card as PokerCard, CardRank, CardSuit } from '@/poker/solver/cards';

// Re-export poker card types for consistency
export type { CardRank, CardSuit };
export type Card = PokerCard;

/**
 * Three-card hand rankings
 */
export enum ThreeCardRank {
  HIGH_CARD = 0,
  PAIR = 1,
  THREE_OF_A_KIND = 2
}

/**
 * Five-card hand rankings (same as standard poker)
 */
export enum FiveCardRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

/**
 * Three-card hand evaluation result
 */
export interface ThreeCardHandValue {
  rank: ThreeCardRank;
  primaryValue: number;  // For trips: trip rank; For pair: pair rank
  kickers: number[];     // Remaining cards in descending order
  description: string;
}

/**
 * Five-card hand evaluation result
 */
export interface FiveCardHandValue {
  rank: FiveCardRank;
  value: number;         // Absolute strength for comparison
  description: string;
}

/**
 * Player's 13-card arrangement into 3 hands
 */
export interface Arrangement {
  front: Card[];   // 3 cards
  middle: Card[];  // 5 cards
  back: Card[];    // 5 cards
}

/**
 * Validation result for an arrangement
 */
export interface ArrangementValidation {
  isValid: boolean;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  type: 'INVALID_CARD_COUNT' | 'MIDDLE_STRONGER_THAN_BACK' | 'FRONT_STRONGER_THAN_MIDDLE';
  message: string;
}

/**
 * Special hands (Naturals)
 */
export enum SpecialHandType {
  NONE = 'NONE',
  DRAGON = 'DRAGON',              // 一条龙 (A-K straight)
  SIX_PAIRS = 'SIX_PAIRS',        // 六对半
  THREE_FLUSHES = 'THREE_FLUSHES', // 三同花
  THREE_STRAIGHTS = 'THREE_STRAIGHTS' // 三顺子
}

export interface SpecialHandResult {
  type: SpecialHandType;
  points: number;
  arrangement?: Arrangement;
}

/**
 * Scoring rules configuration
 */
export interface ScoringRules {
  type: '1-1-1' | '2-4' | '1-6';
  scoopBonus: number;       // 4 for 2-4, 6 for 1-6
  foulPenalty: number;      // Usually -3 per opponent

  specialHands: {
    dragon: number;         // 13 or 26
    sixPairs: number;       // 3
    threeFlushes: number;   // 3
    threeStraights: number; // 3
  };

  royalty: RoyaltyRules;
}

/**
 * Royalty (bonus) rules
 */
export interface RoyaltyRules {
  front: {
    pair6: number;      // 6-6-x: +1
    pair7: number;      // 7-7-x: +2
    pair8: number;      // 8-8-x: +3
    pair9: number;      // 9-9-x: +4
    pairT: number;      // T-T-x: +5
    pairJ: number;      // J-J-x: +6
    pairQ: number;      // Q-Q-x: +7
    pairK: number;      // K-K-x: +8
    pairA: number;      // A-A-x: +9
    trips2: number;     // 2-2-2: +10
    trips3: number;     // 3-3-3: +11
    // ... up to A-A-A: +22
  };
  middle: {
    trips: number;          // +2
    straight: number;       // +4
    flush: number;          // +8
    fullHouse: number;      // +12
    quads: number;          // +20
    straightFlush: number;  // +30
    royalFlush: number;     // +50
  };
  back: {
    quads: number;          // +10
    straightFlush: number;  // +15
    royalFlush: number;     // +25
  };
}

/**
 * Game phase
 */
export enum GamePhase {
  SETUP = 'SETUP',
  DEALING = 'DEALING',
  ARRANGING = 'ARRANGING',
  SCORING = 'SCORING',
  REVIEW = 'REVIEW',
  FINISHED = 'FINISHED'
}

/**
 * Player information
 */
export interface Player {
  id: string;
  name: string;
  totalScore: number;
  isAI: boolean;
}

/**
 * Head-to-head comparison result
 */
export interface HeadToHeadResult {
  frontWinner: number;  // Player index or -1 for tie
  middleWinner: number;
  backWinner: number;
  playerScores: number[];
}

/**
 * Line-by-line results for a player
 */
export interface LineResults {
  frontWins: number;
  middleWins: number;
  backWins: number;
  scoops: number;
  scoopedBy: number;
}

/**
 * Round results
 */
export interface RoundResults {
  roundNumber: number;
  scores: Map<string, number>;      // playerId -> round score
  lineResults: Map<string, LineResults>;
  analyses?: Map<string, AnalysisReport>;  // For human players
}

/**
 * Post-game analysis for a player
 */
export interface AnalysisReport {
  playerArrangement: Arrangement;
  optimalArrangement: Arrangement;

  // Foul check
  isFoul: boolean;
  foulReasons: string[];

  // EV comparison
  playerEV: number;
  optimalEV: number;
  evLoss: number;  // How much EV was left on the table

  // Line-by-line breakdown
  lines: {
    front: LineAnalysis;
    middle: LineAnalysis;
    back: LineAnalysis;
  };

  // Missed opportunities
  missedOpportunities: string[];

  // Strategic feedback
  strategicInsights: string[];
}

/**
 * Analysis for a single line
 */
export interface LineAnalysis {
  hand: Card[];
  handValue: ThreeCardHandValue | FiveCardHandValue;
  winProbability: number;
  optimalHand?: Card[];
  optimalWinProbability?: number;

  assessment: 'optimal' | 'suboptimal' | 'mistake';
  explanation: string;
}

/**
 * Game state
 */
export interface ChinesePokerGameState {
  gameId: string;
  players: Player[];
  currentPhase: GamePhase;
  scoringRules: ScoringRules;
  dealSeed?: string;  // For deterministic replay

  // Round state
  roundNumber: number;
  hands: Map<string, Card[]>;  // playerId -> 13 cards
  arrangements: Map<string, Arrangement | null>;  // playerId -> arrangement

  // Results
  roundResults?: RoundResults;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Default scoring rules (1-1-1)
 */
export const DEFAULT_SCORING_RULES: ScoringRules = {
  type: '1-1-1',
  scoopBonus: 3,
  foulPenalty: 3,

  specialHands: {
    dragon: 13,
    sixPairs: 3,
    threeFlushes: 3,
    threeStraights: 3
  },

  royalty: {
    front: {
      pair6: 1, pair7: 2, pair8: 3, pair9: 4, pairT: 5,
      pairJ: 6, pairQ: 7, pairK: 8, pairA: 9,
      trips2: 10, trips3: 11
    },
    middle: {
      trips: 2,
      straight: 4,
      flush: 8,
      fullHouse: 12,
      quads: 20,
      straightFlush: 30,
      royalFlush: 50
    },
    back: {
      quads: 10,
      straightFlush: 15,
      royalFlush: 25
    }
  }
};
