/**
 * Core types for GTO Poker Trainer
 */

// Card representation
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Suit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs

export interface Card {
  rank: Rank;
  suit: Suit;
}

// Position types for 6-max
export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

// Hand notation (e.g., "AA", "AKs", "AKo")
export type HandNotation = string;

// 13x13 matrix for hand visualization
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Hand type classification
export type HandType = 'pair' | 'suited' | 'offsuit';

export interface HandInfo {
  notation: string;      // e.g., "AKs", "QQ", "72o"
  rank1: Rank;
  rank2: Rank;
  type: HandType;
  row: number;           // 0-12 in matrix
  col: number;           // 0-12 in matrix
}

// GTO Action frequencies
export interface ActionFrequencies {
  fold: number;     // 0-1
  call: number;     // 0-1
  raise: number;    // 0-1 (or sum of different bet sizes)
  raise3x?: number;
  raise4x?: number;
  allIn?: number;
}

// Combined strategy for a hand
export interface HandStrategy {
  hand: HandNotation;
  frequencies: ActionFrequencies;
  ev?: number;          // Expected value in bb
  combos: number;       // Number of combinations (6, 4, or 12)
}

// Full range strategy for a scenario
export interface RangeStrategy {
  scenario: ScenarioInfo;
  hands: Map<HandNotation, HandStrategy>;
}

// Scenario definition
export interface ScenarioInfo {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  position: Position;
  vsPosition?: Position;
  action: 'RFI' | 'vs_RFI' | 'vs_3bet' | 'vs_4bet' | '3bet' | '4bet';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  learningObjectivesZh: string[];
}

// Training session types
export interface TrainingDecision {
  id: string;
  timestamp: number;
  scenarioId: string;
  hand: HandNotation;
  userAction: 'fold' | 'call' | 'raise';
  gtoAction: 'fold' | 'call' | 'raise';
  gtoFrequencies: ActionFrequencies;
  score: number;          // 0-100
  isCorrect: boolean;
}

export interface TrainingStats {
  totalHands: number;
  correctDecisions: number;
  averageScore: number;
  byScenario: Map<string, ScenarioStats>;
}

export interface ScenarioStats {
  scenarioId: string;
  handsPlayed: number;
  correctDecisions: number;
  averageScore: number;
  worstHands: HandNotation[]; // Hands with most errors
}

// Error tracking
export interface ErrorRecord {
  id: string;
  timestamp: number;
  scenarioId: string;
  hand: HandNotation;
  userAction: string;
  correctAction: string;
  gtoFrequencies: ActionFrequencies;
  evLoss?: number;
}

// Heatmap cell data
export interface HeatmapCell {
  hand: HandNotation;
  type: HandType;
  raiseFreq: number;
  callFreq: number;
  foldFreq: number;
  primaryAction: 'raise' | 'call' | 'fold';
  intensity: number; // 0-1 for color gradient
}

// CSV export data
export interface ExportData {
  hand: string;
  type: string;
  raisePercent: string;
  callPercent: string;
  foldPercent: string;
  ev?: string;
}
