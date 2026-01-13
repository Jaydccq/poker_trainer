/**
 * Expected Value (EV) calculator for Chinese Poker
 * Wrapper around rollout solver with backward-compatible API
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule } from '../scoring/basic-scoring';
import { SpecialHandType } from '../special-hands';
import { 
  rolloutSolver, 
  RolloutSolverResult, 
  ArrangementEVResult,
  HandTypeInfo,
  getHandTypes
} from './rollout-solver';

// Re-export types
export type { HandTypeInfo, ArrangementEVResult };
export { getHandTypes };

/**
 * EV calculation options
 */
export interface EVCalculationOptions {
  iterations: number;            // Number of simulations per arrangement
  numOpponents: number;          // 1-3 opponents
  scoringRule: ScoringRule;      // Scoring variant
  maxArrangements?: number;      // Max arrangements to evaluate
  seed?: number;                 // Random seed
}

/**
 * Optimal arrangement result
 */
export interface OptimalArrangementResult {
  optimalArrangement: Arrangement;
  optimalEV: number;
  optimalHandTypes: HandTypeInfo;
  specialHand?: { type: SpecialHandType; points: number };
  arrangementsEvaluated: number;
  totalArrangementsGenerated: number;
  allResults: ArrangementEVResult[];
}

/**
 * Find optimal arrangement using Rollout solver
 */
export function findOptimalArrangement(
  cards: Card[],
  options: EVCalculationOptions
): OptimalArrangementResult {
  const result = rolloutSolver(cards, {
    numSimulations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    maxEvaluate: options.maxArrangements,
    seed: options.seed
  });

  return {
    optimalArrangement: result.optimalArrangement,
    optimalEV: result.optimalEV,
    optimalHandTypes: result.optimalHandTypes,
    specialHand: result.specialHand,
    arrangementsEvaluated: result.arrangementsEvaluated,
    totalArrangementsGenerated: result.arrangementsEvaluated,  // TODO: track actual total
    allResults: result.topArrangements
  };
}

/**
 * Calculate EV for a specific arrangement
 */
export function calculateArrangementEV(
  cards: Card[],
  arrangementIndex: number,
  options: EVCalculationOptions
): ArrangementEVResult {
  // Use rollout solver to find the arrangement at index
  const result = rolloutSolver(cards, {
    numSimulations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    maxEvaluate: arrangementIndex + 1,
    seed: options.seed
  });

  if (result.topArrangements.length <= arrangementIndex) {
    throw new Error(`Arrangement index ${arrangementIndex} out of bounds`);
  }

  return result.topArrangements[arrangementIndex];
}
