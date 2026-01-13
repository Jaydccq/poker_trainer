/**
 * Post-game analyzer for Chinese Poker
 * Compares player choices against optimal arrangements
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule } from '../scoring/basic-scoring';
import { simulateArrangement } from './monte-carlo';
import { 
  findOptimalArrangement, 
  EVCalculationOptions, 
  getHandTypes,
  HandTypeInfo,
  OptimalArrangementResult
} from './ev-calculator';

/**
 * Analysis options
 */
export interface AnalysisOptions {
  iterations: number;
  numOpponents: number;
  scoringRule: ScoringRule;
  maxArrangements?: number;
  seed?: number;
}

/**
 * Suggestion for improvement
 */
export interface Suggestion {
  type: 'front' | 'middle' | 'back' | 'general';
  message: string;
  evImpact?: number;  // How much EV was lost
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  playerEV: number;
  optimalEV: number;
  evDifference: number;          // optimalEV - playerEV (positive = missed value)
  isOptimal: boolean;            // Player chose optimal or near-optimal (within 0.1 EV)
  optimalArrangement: Arrangement;
  suggestions: Suggestion[];
  playerWinRate: number;
  optimalWinRate: number;
  playerHandTypes: HandTypeInfo;       // Player's hand type descriptions
  optimalHandTypes: HandTypeInfo;      // Optimal hand type descriptions
}

/**
 * Pre-calculation result (for background computation)
 */
export interface PreCalculationResult {
  optimalResult: OptimalArrangementResult;
  calculationTime: number;  // ms
}

/**
 * Pre-calculate optimal arrangement (call during dealing phase)
 */
export function preCalculateOptimal(
  cards: Card[],
  options: AnalysisOptions
): PreCalculationResult {
  const startTime = Date.now();
  
  const evOptions: EVCalculationOptions = {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    maxArrangements: options.maxArrangements,
    seed: options.seed
  };

  const optimalResult = findOptimalArrangement(cards, evOptions);
  const calculationTime = Date.now() - startTime;

  return {
    optimalResult,
    calculationTime
  };
}

/**
 * Analyze player's arrangement choice using pre-calculated optimal
 */
export function analyzePlayerChoiceWithPreCalc(
  cards: Card[],
  playerArrangement: Arrangement,
  preCalc: PreCalculationResult,
  options: AnalysisOptions
): AnalysisResult {
  // Calculate player EV
  const playerSimResult = simulateArrangement(playerArrangement, cards, {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    seed: options.seed
  });

  const playerHandTypes = getHandTypes(playerArrangement);
  const optimalResult = preCalc.optimalResult;

  // Calculate EV difference
  const evDifference = optimalResult.optimalEV - playerSimResult.averageScore;
  const isOptimal = Math.abs(evDifference) < 0.1; // Within 0.1 EV is considered optimal

  // Generate suggestions
  const suggestions: Suggestion[] = [];

  if (!isOptimal) {
    if (evDifference > 0.5) {
      suggestions.push({
        type: 'general',
        message: `Your arrangement has significantly lower EV (${evDifference.toFixed(2)} points lost). Consider maximizing back hand strength first.`,
        evImpact: evDifference
      });
    } else if (evDifference > 0.1) {
      suggestions.push({
        type: 'general',
        message: `Your arrangement is close but suboptimal (${evDifference.toFixed(2)} points lost). Small adjustments could improve results.`,
        evImpact: evDifference
      });
    }

    // Compare specific rows
    if (playerHandTypes.back.rank < optimalResult.optimalHandTypes.back.rank) {
      suggestions.push({
        type: 'back',
        message: `Back row could be stronger: ${optimalResult.optimalHandTypes.back.description} vs your ${playerHandTypes.back.description}`
      });
    }
    
    if (playerHandTypes.front.rank < optimalResult.optimalHandTypes.front.rank) {
      suggestions.push({
        type: 'front',
        message: `Front row could be stronger: ${optimalResult.optimalHandTypes.front.description} vs your ${playerHandTypes.front.description}`
      });
    }
  }

  return {
    playerEV: playerSimResult.averageScore,
    optimalEV: optimalResult.optimalEV,
    evDifference,
    isOptimal,
    optimalArrangement: optimalResult.optimalArrangement,
    suggestions,
    playerWinRate: playerSimResult.winRate,
    optimalWinRate: optimalResult.allResults[0]?.winRate || 0,
    playerHandTypes,
    optimalHandTypes: optimalResult.optimalHandTypes
  };
}

/**
 * Analyze player's arrangement choice (original API - still calculates optimal)
 */
export function analyzePlayerChoice(
  cards: Card[],
  playerArrangement: Arrangement,
  options: AnalysisOptions
): AnalysisResult {
  if (cards.length !== 13) {
    throw new Error('Must provide exactly 13 cards');
  }

  // Calculate player EV
  const playerSimResult = simulateArrangement(playerArrangement, cards, {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    seed: options.seed
  });

  const playerHandTypes = getHandTypes(playerArrangement);

  // Find optimal arrangement
  const evOptions: EVCalculationOptions = {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    maxArrangements: options.maxArrangements,
    seed: options.seed
  };

  const optimalResult = findOptimalArrangement(cards, evOptions);

  // Calculate EV difference
  const evDifference = optimalResult.optimalEV - playerSimResult.averageScore;
  const isOptimal = Math.abs(evDifference) < 0.1; // Within 0.1 EV is considered optimal

  // Generate suggestions
  const suggestions: Suggestion[] = [];

  if (!isOptimal) {
    if (evDifference > 0.5) {
      suggestions.push({
        type: 'general',
        message: `Your arrangement has significantly lower EV (${evDifference.toFixed(2)} points lost). Consider maximizing back hand strength first.`,
        evImpact: evDifference
      });
    } else if (evDifference > 0.1) {
      suggestions.push({
        type: 'general',
        message: `Your arrangement is close but suboptimal (${evDifference.toFixed(2)} points lost). Small adjustments could improve results.`,
        evImpact: evDifference
      });
    }

    suggestions.push({
      type: 'general',
      message: 'Review the optimal arrangement to see alternative card placements.'
    });
  }

  return {
    playerEV: playerSimResult.averageScore,
    optimalEV: optimalResult.optimalEV,
    evDifference,
    isOptimal,
    optimalArrangement: optimalResult.optimalArrangement,
    suggestions,
    playerWinRate: playerSimResult.winRate,
    optimalWinRate: optimalResult.allResults[0]?.winRate || 0,
    playerHandTypes,
    optimalHandTypes: optimalResult.optimalHandTypes
  };
}
