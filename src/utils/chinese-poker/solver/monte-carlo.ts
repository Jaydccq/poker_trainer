/**
 * Monte Carlo simulator for Chinese Poker
 * Evaluates arrangement strength by simulating random opponent hands
 */

import { Card, ALL_SUITS, RANKS_BY_VALUE } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule, scoreMatchup } from '../scoring/basic-scoring';
import { generateValidArrangements } from '../generator';
import { getAllSpecialHands } from '../special-hands';

/**
 * Linear Congruential Generator for deterministic random
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
 * Simulation options
 */
export interface SimulationOptions {
  iterations: number;           // Number of Monte Carlo iterations
  numOpponents: number;          // 1-3 opponents
  scoringRule: ScoringRule;      // Scoring variant
  seed?: number;                 // Random seed for determinism
}

/**
 * Simulation result
 */
export interface SimulationResult {
  averageScore: number;          // Expected value (EV)
  winRate: number;               // Percentage of games won (score > 0)
  scoopRate: number;             // Percentage of games with scoop
  iterations: number;            // Number of iterations run
  scoreDistribution?: {          // Optional detailed stats
    min: number;
    max: number;
    median: number;
    stdDev: number;
  };
}

/**
 * Simulate an arrangement against random opponents
 */
export function simulateArrangement(
  playerArrangement: Arrangement,
  usedCards: Card[],
  options: SimulationOptions
): SimulationResult {
  const rng = new SeededRandom(options.seed ?? Date.now());

  // Create deck excluding used cards
  const availableCards = createDeck().filter(
    card => !usedCards.some(used =>
      used.rank === card.rank && used.suit === card.suit
    )
  );

  const scores: number[] = [];
  let scoopCount = 0;

  // Detect player's special hand
  const playerSpecial = getAllSpecialHands(usedCards, playerArrangement);

  for (let i = 0; i < options.iterations; i++) {
    // Shuffle available cards
    const shuffled = rng.shuffle(availableCards);

    // Deal cards to opponents
    const opponentHands: Card[][] = [];
    for (let j = 0; j < options.numOpponents; j++) {
      opponentHands.push(shuffled.slice(j * 13, (j + 1) * 13));
    }

    // Generate optimal arrangements for opponents (use first valid)
    const opponentArrangements: Arrangement[] = [];
    const opponentSpecials: Array<{ type: any; points: number } | null> = [];

    for (const hand of opponentHands) {
      const special = getAllSpecialHands(hand);
      opponentSpecials.push(special.isValid ? special : null);

      // For now, use first valid arrangement (can be optimized later)
      const validArrangements = generateValidArrangements(hand, { maxArrangements: 1 });
      if (validArrangements.length > 0) {
        opponentArrangements.push(validArrangements[0]);
      }
    }

    // Score against each opponent
    let totalScore = 0;
    let allScoops = true;

    for (let j = 0; j < opponentArrangements.length; j++) {
      const result = scoreMatchup(
        playerArrangement,
        opponentArrangements[j],
        options.scoringRule,
        playerSpecial.isValid ? { type: playerSpecial.type!, points: playerSpecial.points } : undefined,
        opponentSpecials[j] || undefined
      );

      totalScore += result.totalPoints;
      if (!result.scoop || result.totalPoints < 0) {
        allScoops = false;
      }
    }

    scores.push(totalScore);
    if (allScoops && opponentArrangements.length > 0) {
      scoopCount++;
    }
  }

  // Calculate statistics
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const winRate = scores.filter(s => s > 0).length / scores.length;
  const scoopRate = scoopCount / options.iterations;

  return {
    averageScore,
    winRate,
    scoopRate,
    iterations: options.iterations
  };
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
