/**
 * Rollout-based optimal solver for Chinese Poker
 * Uses efficient sampling and row-wise win probability evaluation
 */

import { Card, ALL_SUITS, RANKS_BY_VALUE } from '@/poker/solver/cards';
import { Arrangement, ThreeCardHandValue, FiveCardHandValue } from '@/types/chinese-poker';
import { ScoringRule, scoreMatchup } from '../scoring/basic-scoring';
import { generateValidArrangements } from '../generator';
import { getAllSpecialHands, SpecialHandType } from '../special-hands';
import { evaluateThreeCardHand } from '../hand-3card';
import { evaluateFiveCardHand } from '../hand-5card';

/**
 * Seeded random number generator for deterministic results
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Hand type info for display
 */
export interface HandTypeInfo {
  front: ThreeCardHandValue;
  middle: FiveCardHandValue;
  back: FiveCardHandValue;
}

/**
 * Get hand type descriptions for an arrangement
 */
export function getHandTypes(arrangement: Arrangement): HandTypeInfo {
  return {
    front: evaluateThreeCardHand(arrangement.front),
    middle: evaluateFiveCardHand(arrangement.middle),
    back: evaluateFiveCardHand(arrangement.back)
  };
}

/**
 * Rollout options
 */
export interface RolloutOptions {
  numSimulations: number;      // Number of opponent hands to sample
  numOpponents: number;        // 1-3 opponents
  scoringRule: ScoringRule;    // Scoring variant
  seed?: number;               // Random seed
}

/**
 * Result for a single arrangement evaluation
 */
export interface ArrangementEVResult {
  arrangement: Arrangement;
  ev: number;
  winRate: number;
  scoopRate: number;
  handTypes: HandTypeInfo;
}

/**
 * Full solver result
 */
export interface RolloutSolverResult {
  optimalArrangement: Arrangement;
  optimalEV: number;
  optimalHandTypes: HandTypeInfo;
  specialHand?: { type: SpecialHandType; points: number };
  arrangementsEvaluated: number;
  topArrangements: ArrangementEVResult[];  // Top 10 arrangements by EV
}

/**
 * Create a full 52-card deck
 */
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of RANKS_BY_VALUE) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Get remaining deck after removing used cards
 */
function getRemainingDeck(usedCards: Card[]): Card[] {
  const usedSet = new Set(usedCards.map(c => `${c.rank}${c.suit}`));
  return createDeck().filter(c => !usedSet.has(`${c.rank}${c.suit}`));
}

/**
 * Fast arrangement scoring using Monte Carlo rollout
 * 
 * For each arrangement:
 * 1. Sample opponent hands from remaining 39 cards
 * 2. Generate valid arrangement for opponent (first valid = reasonable proxy)
 * 3. Score matchup
 * 4. Average over all samples
 */
function evaluateArrangementRollout(
  arrangement: Arrangement,
  playerCards: Card[],
  remainingDeck: Card[],
  options: RolloutOptions,
  rng: SeededRandom
): { ev: number; winRate: number; scoopRate: number } {
  let totalScore = 0;
  let wins = 0;
  let scoops = 0;

  // Check player's special hand
  const playerSpecial = getAllSpecialHands(playerCards, arrangement);
  const playerSpecialHand = playerSpecial.isValid
    ? { type: playerSpecial.type!, points: playerSpecial.points }
    : undefined;

  for (let sim = 0; sim < options.numSimulations; sim++) {
    // Shuffle remaining deck for this simulation
    const shuffled = rng.shuffle(remainingDeck);
    
    let simScore = 0;
    let allWins = true;

    // Deal to each opponent
    for (let opp = 0; opp < options.numOpponents; opp++) {
      const oppCards = shuffled.slice(opp * 13, (opp + 1) * 13);
      
      // Get first valid arrangement for opponent (fast approximation)
      const oppArrangements = generateValidArrangements(oppCards, { maxArrangements: 1 });
      
      if (oppArrangements.length === 0) {
        // Opponent has no valid arrangement (foul) - player auto-wins
        simScore += 6;  // Scoop points
        continue;
      }
      
      const oppArrangement = oppArrangements[0];
      
      // Check opponent's special hand
      const oppSpecial = getAllSpecialHands(oppCards, oppArrangement);
      const oppSpecialHand = oppSpecial.isValid
        ? { type: oppSpecial.type!, points: oppSpecial.points }
        : undefined;

      // Score matchup
      const result = scoreMatchup(
        arrangement,
        oppArrangement,
        options.scoringRule,
        playerSpecialHand,
        oppSpecialHand
      );

      simScore += result.totalPoints;
      
      if (result.totalPoints <= 0 || !result.scoop) {
        allWins = false;
      }
    }

    totalScore += simScore;
    if (simScore > 0) wins++;
    if (allWins && options.numOpponents > 0) scoops++;
  }

  return {
    ev: totalScore / options.numSimulations,
    winRate: wins / options.numSimulations,
    scoopRate: scoops / options.numSimulations
  };
}

/**
 * Heuristic score for pre-sorting arrangements
 * Higher = likely better (prioritize strong back, then middle, then front)
 */
function heuristicScore(arrangement: Arrangement): number {
  const back = evaluateFiveCardHand(arrangement.back);
  const middle = evaluateFiveCardHand(arrangement.middle);
  const front = evaluateThreeCardHand(arrangement.front);
  
  return (
    back.rank * 100000 + 
    back.value / 10 +
    middle.rank * 1000 + 
    middle.value / 1000 +
    front.rank * 10 +
    front.primaryValue
  );
}

/**
 * Main Rollout Solver
 * 
 * Algorithm:
 * 1. Generate ALL valid arrangements
 * 2. Sort by heuristic (best first)
 * 3. Evaluate top N with Monte Carlo rollout
 * 4. Return best EV arrangement
 */
export function rolloutSolver(
  cards: Card[],
  options: RolloutOptions & { maxEvaluate?: number }
): RolloutSolverResult {
  if (cards.length !== 13) {
    throw new Error('Must provide exactly 13 cards');
  }

  const rng = new SeededRandom(options.seed ?? Date.now());

  // Check for special hands first
  const specialHandResult = getAllSpecialHands(cards);
  const specialHand = specialHandResult.isValid
    ? { type: specialHandResult.type!, points: specialHandResult.points }
    : undefined;

  // Generate ALL valid arrangements
  const allArrangements = generateValidArrangements(cards);

  if (allArrangements.length === 0) {
    throw new Error('No valid arrangements found');
  }

  // Sort by heuristic (best candidates first)
  const scored = allArrangements.map(arr => ({
    arrangement: arr,
    hScore: heuristicScore(arr)
  }));
  scored.sort((a, b) => b.hScore - a.hScore);

  // Evaluate top arrangements with rollout
  const maxEvaluate = options.maxEvaluate ?? Math.min(100, allArrangements.length);
  const toEvaluate = scored.slice(0, maxEvaluate);

  // Get remaining deck for simulations
  const remainingDeck = getRemainingDeck(cards);

  const results: ArrangementEVResult[] = [];

  for (const { arrangement } of toEvaluate) {
    const { ev, winRate, scoopRate } = evaluateArrangementRollout(
      arrangement,
      cards,
      remainingDeck,
      options,
      rng
    );

    results.push({
      arrangement,
      ev,
      winRate,
      scoopRate,
      handTypes: getHandTypes(arrangement)
    });
  }

  // Sort by EV descending
  results.sort((a, b) => b.ev - a.ev);

  // Best result
  const best = results[0];
  let optimalEV = best.ev;

  // If special hand beats best normal arrangement
  if (specialHand && specialHand.points > optimalEV) {
    optimalEV = specialHand.points;
  }

  return {
    optimalArrangement: best.arrangement,
    optimalEV,
    optimalHandTypes: best.handTypes,
    specialHand,
    arrangementsEvaluated: results.length,
    topArrangements: results.slice(0, 10)
  };
}

// Re-export for compatibility with existing code
export { getHandTypes as getArrangementHandTypes };
