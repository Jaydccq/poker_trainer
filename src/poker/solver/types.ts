/**
 * Types for Custom GTO Solution Builder
 * Defines all interfaces for solver configuration, betting trees, and results
 */

import { Position, HandNotation, ActionFrequencies, Rank, RANKS } from '../types';

// Re-export needed types for other solver modules
export type { Position, HandNotation, ActionFrequencies, Rank };
export { RANKS };

// ============================================================================
// Range Types
// ============================================================================

/**
 * Weight for each hand (0-1 representing frequency)
 */
export type RangeWeights = Record<HandNotation, number>;

/**
 * Player range configuration
 */
export interface PlayerRange {
  label: string;
  weights: RangeWeights;
}

/**
 * Initialize an empty range with all weights at 0
 */
export function createEmptyRange(): RangeWeights {
  const weights: RangeWeights = {};
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const rank1 = RANKS[row];
      const rank2 = RANKS[col];
      let notation: string;
      if (row === col) {
        notation = `${rank1}${rank1}`;
      } else if (row < col) {
        notation = `${rank1}${rank2}s`;
      } else {
        notation = `${rank2}${rank1}o`;
      }
      weights[notation] = 0;
    }
  }
  return weights;
}

/**
 * Initialize a full range with all weights at 1
 */
export function createFullRange(): RangeWeights {
  const weights = createEmptyRange();
  Object.keys(weights).forEach(k => weights[k] = 1);
  return weights;
}

// ============================================================================
// Betting Tree Types
// ============================================================================

/**
 * Bet sizing input modes
 */
export type BetSizeUnit = 'pot_percent' | 'geometric' | 'multiplier' | 'bb';

/**
 * Individual bet size configuration
 */
export interface BetSize {
  value: number;
  unit: BetSizeUnit;
}

/**
 * Bet sizing mode
 */
export type BetSizingMode = 'automatic' | 'dynamic' | 'fixed';

/**
 * Position in hand (IP = In Position, OOP = Out of Position)
 */
export type PositionType = 'IP' | 'OOP';

/**
 * Street in poker
 */
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

/**
 * Betting tree configuration for a street
 */
export interface StreetBettingConfig {
  mode: BetSizingMode;
  // For dynamic mode: number of sizes to select
  numBetSizes: number;
  numRaiseSizes: number;
  // For fixed/dynamic: specific sizes to consider
  betSizes: BetSize[];
  raiseSizes: BetSize[];
  // Specify sizes for dynamic simplification
  specifySizesToCompare: boolean;
  sizesToCompare: BetSize[];
}

/**
 * Advanced betting tree options
 */
export interface AdvancedOptions {
  alwaysAddAllIn: boolean;
  forceAllInThreshold: number; // % of stack
  addAllInThreshold: number;   // % of pot
  betSizeMergingThreshold: number; // %
}

/**
 * Full betting tree configuration
 */
export interface BettingTreeConfig {
  // Whether IP inherits from OOP settings
  ipInheritsFromOop: boolean;
  // Whether later streets inherit from flop
  streetsInherit: boolean;
  
  // Per-street, per-player configs
  oopConfig: Record<Street, StreetBettingConfig>;
  ipConfig: Record<Street, StreetBettingConfig>;
  
  advancedOptions: AdvancedOptions;
}

/**
 * Action types in betting tree
 */
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

/**
 * Betting tree node
 */
export interface BettingTreeNode {
  id: string;
  type: 'action' | 'chance' | 'terminal' | 'showdown';
  player?: PositionType;
  street: Street;
  pot: number;
  stack: number;
  actions?: TreeAction[];
  children?: BettingTreeNode[];
  // For terminal nodes
  result?: 'fold' | 'showdown';
  winner?: PositionType;
}

/**
 * Action edge in betting tree
 */
export interface TreeAction {
  type: ActionType;
  amount?: number; // For bet/raise
  child: BettingTreeNode;
}

// ============================================================================
// Solution Configuration Types
// ============================================================================

/**
 * Starting street for the solution
 */
export type StartingStreet = 'preflop' | 'flop' | 'turn' | 'river';

/**
 * Board cards (for postflop)
 */
export interface BoardCards {
  flop?: [string, string, string];
  turn?: string;
  river?: string;
}

/**
 * Full custom solution configuration
 */
export interface CustomSolutionConfig {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  
  // Game setup
  startingStreet: StartingStreet;
  stackSize: number; // in bb
  potSize: number;   // in bb
  
  // Player ranges
  ipRange: PlayerRange;
  oopRange: PlayerRange;
  
  // Betting tree
  bettingTree: BettingTreeConfig;
  
  // Board (for postflop)
  board?: BoardCards;
  
  // Tags for organization
  tags: string[];
}

// ============================================================================
// Solver Types
// ============================================================================

/**
 * Solver configuration
 */
export interface SolverConfig {
  maxIterations: number;
  convergenceThreshold: number; // Stop when exploitability < this
  
  // Discounted CFR parameters
  alpha: number; // Positive regret discount exponent (typical: 1.5)
  beta: number;  // Negative regret discount factor (typical: 0.5)
  gamma: number; // Cumulative strategy discount exponent (typical: 2.0)
  theta: number; // Strategy decay factor (typical: 0.99)
  
  // Warmup parameters
  warmupIterations: number;    // Number of warmup iterations
  warmupSampleRate: number;    // Sampling rate during warmup (0-1)
  
  // Suit isomorphism optimization
  useSuitIsomorphism: boolean; // Enable suit equivalence optimization
  
  // Parallelization (for future Web Worker support)
  useParallel: boolean;        // Enable parallel processing
  numWorkers: number;          // Number of workers to use
}

/**
 * Default solver configuration
 */
export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxIterations: 1000,
  convergenceThreshold: 0.01,
  
  // Discounted CFR parameters
  alpha: 1.5,
  beta: 0.5,
  gamma: 2.0,
  theta: 0.99,
  
  // Warmup parameters
  warmupIterations: 50,
  warmupSampleRate: 0.3, // Sample 30% of combos during warmup
  
  // Suit isomorphism
  useSuitIsomorphism: true,
  
  // Parallelization (disabled by default for browser compatibility)
  useParallel: false,
  numWorkers: 4,
};

/**
 * Solver progress callback
 */
export interface SolverProgress {
  iteration: number;
  maxIterations: number;
  exploitability: number;
  elapsed: number; // ms
  status: 'running' | 'converged' | 'max_iterations' | 'cancelled';
}

/**
 * Strategy for a single hand at a node
 */
export interface HandNodeStrategy {
  hand: HandNotation;
  actionFrequencies: Record<ActionType, number>;
  regrets: Record<ActionType, number>;
  ev: number;
}

/**
 * Strategy for all hands at a node
 */
export interface NodeStrategy {
  nodeId: string;
  player: PositionType;
  strategies: HandNodeStrategy[];
}

/**
 * Complete solver result
 */
export interface SolverResult {
  config: CustomSolutionConfig;
  solverConfig: SolverConfig;
  
  // Converged strategies per node
  strategies: Map<string, NodeStrategy>;
  
  // Aggregate stats
  totalIterations: number;
  finalExploitability: number;
  solveTime: number; // ms
  
  // Root EV for each player
  ipEV: number;
  oopEV: number;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Tag for organizing saved items
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * Saved range preset
 */
export interface SavedRange {
  id: string;
  name: string;
  range: RangeWeights;
  tags: string[];
  createdAt: number;
}

/**
 * Saved parameter preset
 */
export interface SavedParameters {
  id: string;
  name: string;
  stackSize: number;
  potSize: number;
  bettingTree: BettingTreeConfig;
  tags: string[];
  createdAt: number;
}

/**
 * Saved complete solution
 */
export interface SavedSolution {
  id: string;
  name: string;
  config: CustomSolutionConfig;
  result?: SolverResult;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get number of combos for a hand notation
 */
export function getHandComboCount(notation: HandNotation): number {
  if (notation.length === 2 && notation[0] === notation[1]) {
    return 6; // Pairs: C(4,2)
  }
  if (notation.endsWith('s')) {
    return 4; // Suited: 4 suits
  }
  return 12; // Offsuit: 4 * 3
}

/**
 * Calculate total combos in a range
 */
export function getRangeCombos(weights: RangeWeights): number {
  let total = 0;
  for (const [hand, weight] of Object.entries(weights)) {
    total += getHandComboCount(hand) * weight;
  }
  return total;
}

/**
 * Calculate range percentage (0-100)
 */
export function getRangePercent(weights: RangeWeights): number {
  const combos = getRangeCombos(weights);
  return (combos / 1326) * 100; // 1326 = total preflop combos
}

/**
 * Convert bet size to pot percentage
 */
export function betSizeToPotPercent(size: BetSize, pot: number, stack: number): number {
  switch (size.unit) {
    case 'pot_percent':
      return size.value;
    case 'geometric':
      // Geometric sizing: bet X streets to go all-in
      // size = (stack / pot)^(1/X) - 1
      return ((stack / pot) ** (1 / size.value) - 1) * 100;
    case 'multiplier':
      // Multiplier of previous bet (for raises)
      return size.value * 100; // Simplified
    case 'bb':
      return (size.value / pot) * 100;
    default:
      return size.value;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default betting tree config
 */
export function createDefaultBettingTreeConfig(): BettingTreeConfig {
  const defaultStreetConfig: StreetBettingConfig = {
    mode: 'automatic',
    numBetSizes: 2,
    numRaiseSizes: 1,
    betSizes: [
      { value: 33, unit: 'pot_percent' },
      { value: 66, unit: 'pot_percent' },
      { value: 100, unit: 'pot_percent' },
    ],
    raiseSizes: [
      { value: 2.5, unit: 'multiplier' },
      { value: 3, unit: 'multiplier' },
    ],
    specifySizesToCompare: false,
    sizesToCompare: [],
  };

  return {
    ipInheritsFromOop: true,
    streetsInherit: true,
    oopConfig: {
      preflop: { ...defaultStreetConfig },
      flop: { ...defaultStreetConfig },
      turn: { ...defaultStreetConfig },
      river: { ...defaultStreetConfig },
    },
    ipConfig: {
      preflop: { ...defaultStreetConfig },
      flop: { ...defaultStreetConfig },
      turn: { ...defaultStreetConfig },
      river: { ...defaultStreetConfig },
    },
    advancedOptions: {
      alwaysAddAllIn: true,
      forceAllInThreshold: 80,
      addAllInThreshold: 50,
      betSizeMergingThreshold: 12,
    },
  };
}

/**
 * Create a new empty solution config
 */
export function createNewSolutionConfig(): CustomSolutionConfig {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'New Solution',
    createdAt: now,
    updatedAt: now,
    startingStreet: 'preflop',
    stackSize: 100,
    potSize: 1.5, // SB + BB
    ipRange: { label: 'IP', weights: createEmptyRange() },
    oopRange: { label: 'OOP', weights: createEmptyRange() },
    bettingTree: createDefaultBettingTreeConfig(),
    tags: [],
  };
}
