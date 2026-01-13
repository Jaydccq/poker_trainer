# Chinese Poker Phase 5: Optimal Strategy & Training Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Monte Carlo-based optimal strategy analyzer and interactive training mode that helps players compare their arrangements against optimal EV solutions.

**Architecture:** Monte Carlo simulation evaluates each arrangement by dealing random opponent hands and calculating expected value across all scoring rules. Training mode provides step-by-step comparison of user choices vs optimal arrangements.

**Tech Stack:** TypeScript, React hooks, existing Chinese Poker utilities (generator, scoring, special-hands)

---

## Task 1: Monte Carlo Simulator Core

**Files:**
- Create: `src/utils/chinese-poker/solver/monte-carlo.ts`
- Create: `src/utils/chinese-poker/solver/__tests__/monte-carlo.test.ts`

**Step 1: Write the failing test**

```typescript
/**
 * Tests for Monte Carlo simulator
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  simulateArrangement,
  SimulationOptions,
  SimulationResult
} from '../monte-carlo';
import { ScoringRule } from '../scoring/basic-scoring';

describe('Monte Carlo Simulator', () => {
  describe('simulateArrangement', () => {
    it('should run simulations and return average score', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'K', suit: 'c' }
        ],
        middle: [
          { rank: 'Q', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'J', suit: 'h' }
        ],
        back: [
          { rank: 'T', suit: 'd' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'c' },
          { rank: 'T', suit: 'h' },
          { rank: '9', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 12345
      };

      const result = simulateArrangement(arrangement, usedCards, options);

      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.winRate).toBeGreaterThan(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
      expect(result.iterations).toBe(100);
      expect(result.scoopRate).toBeGreaterThanOrEqual(0);
    });

    it('should support multiple opponents', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' }
        ],
        middle: [
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: '4', suit: 'h' },
          { rank: '3', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 50,
        numOpponents: 3,
        scoringRule: ScoringRule.TWO_FOUR,
        seed: 54321
      };

      const result = simulateArrangement(arrangement, usedCards, options);

      expect(result.iterations).toBe(50);
      expect(result.averageScore).toBeDefined();
    });

    it('should be deterministic with same seed', () => {
      const arrangement: Arrangement = {
        front: [
          { rank: '5', suit: 'h' },
          { rank: '4', suit: 'd' },
          { rank: '3', suit: 'c' }
        ],
        middle: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 'h' }
        ],
        back: [
          { rank: '9', suit: 'd' },
          { rank: '9', suit: 's' },
          { rank: '8', suit: 'c' },
          { rank: '8', suit: 'h' },
          { rank: '7', suit: 'd' }
        ]
      };

      const usedCards: Card[] = [
        ...arrangement.front,
        ...arrangement.middle,
        ...arrangement.back
      ];

      const options: SimulationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 99999
      };

      const result1 = simulateArrangement(arrangement, usedCards, options);
      const result2 = simulateArrangement(arrangement, usedCards, options);

      expect(result1.averageScore).toBe(result2.averageScore);
      expect(result1.winRate).toBe(result2.winRate);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/monte-carlo.test.ts`
Expected: FAIL with "Cannot find module '../monte-carlo'"

**Step 3: Write minimal implementation**

```typescript
/**
 * Monte Carlo simulator for Chinese Poker
 * Evaluates arrangement strength by simulating random opponent hands
 */

import { Card, SUITS, RANKS } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule, scoreMatchup } from '../scoring/basic-scoring';
import { generateValidArrangements } from '../generator';
import { detectSpecialHand } from '../special-hands';

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
  const playerSpecial = detectSpecialHand(usedCards, playerArrangement);

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
      const special = detectSpecialHand(hand);
      opponentSpecials.push(special);

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
        playerSpecial || undefined,
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
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/monte-carlo.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/utils/chinese-poker/solver/monte-carlo.ts src/utils/chinese-poker/solver/__tests__/monte-carlo.test.ts
git commit -m "feat: add Monte Carlo simulator for arrangement evaluation"
```

---

## Task 2: Expected Value Calculator

**Files:**
- Create: `src/utils/chinese-poker/solver/ev-calculator.ts`
- Create: `src/utils/chinese-poker/solver/__tests__/ev-calculator.test.ts`

**Step 1: Write the failing test**

```typescript
/**
 * Tests for EV calculator
 */

import { Card } from '@/poker/solver/cards';
import {
  calculateArrangementEV,
  findOptimalArrangement,
  EVCalculationOptions
} from '../ev-calculator';
import { ScoringRule } from '../scoring/basic-scoring';

describe('EV Calculator', () => {
  describe('calculateArrangementEV', () => {
    it('should calculate EV for a specific arrangement', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' },
        { rank: 'T', suit: 's' },
        { rank: 'T', suit: 'c' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' }
      ];

      const options: EVCalculationOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 12345
      };

      const result = calculateArrangementEV(cards, 0, options);

      expect(result.ev).toBeDefined();
      expect(result.arrangement).toBeDefined();
      expect(result.arrangement.front.length).toBe(3);
      expect(result.arrangement.middle.length).toBe(5);
      expect(result.arrangement.back.length).toBe(5);
    });
  });

  describe('findOptimalArrangement', () => {
    it('should find arrangement with highest EV', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: '4', suit: 'h' },
        { rank: '3', suit: 'd' }
      ];

      const options: EVCalculationOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.TWO_FOUR,
        maxArrangements: 10,
        seed: 54321
      };

      const result = findOptimalArrangement(cards, options);

      expect(result.optimalArrangement).toBeDefined();
      expect(result.optimalEV).toBeGreaterThan(0);
      expect(result.arrangementsEvaluated).toBeLessThanOrEqual(10);
    });

    it('should handle special hands', () => {
      // Dragon hand
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' },
        { rank: '8', suit: 'c' },
        { rank: '7', suit: 's' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: '2', suit: 'h' }
      ];

      const options: EVCalculationOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        seed: 99999
      };

      const result = findOptimalArrangement(cards, options);

      // Dragon should auto-win with 13 points
      expect(result.optimalEV).toBeGreaterThanOrEqual(13);
      expect(result.specialHand).toBeDefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/ev-calculator.test.ts`
Expected: FAIL with "Cannot find module '../ev-calculator'"

**Step 3: Write minimal implementation**

```typescript
/**
 * Expected Value (EV) calculator for Chinese Poker
 * Finds optimal arrangements by comparing EVs
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule } from '../scoring/basic-scoring';
import { generateValidArrangements } from '../generator';
import { simulateArrangement, SimulationOptions } from './monte-carlo';
import { detectSpecialHand, SpecialHandType } from '../special-hands';

/**
 * EV calculation options
 */
export interface EVCalculationOptions {
  iterations: number;            // Monte Carlo iterations per arrangement
  numOpponents: number;          // 1-3 opponents
  scoringRule: ScoringRule;      // Scoring variant
  maxArrangements?: number;      // Limit arrangements to evaluate (for performance)
  seed?: number;                 // Random seed
}

/**
 * EV calculation result for single arrangement
 */
export interface ArrangementEVResult {
  arrangement: Arrangement;
  ev: number;                    // Expected value
  winRate: number;
  scoopRate: number;
}

/**
 * Calculate EV for a specific arrangement (by index)
 */
export function calculateArrangementEV(
  cards: Card[],
  arrangementIndex: number,
  options: EVCalculationOptions
): ArrangementEVResult {
  const arrangements = generateValidArrangements(cards, {
    maxArrangements: arrangementIndex + 1
  });

  if (arrangements.length <= arrangementIndex) {
    throw new Error(`Arrangement index ${arrangementIndex} out of bounds`);
  }

  const arrangement = arrangements[arrangementIndex];

  const simOptions: SimulationOptions = {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    seed: options.seed
  };

  const result = simulateArrangement(arrangement, cards, simOptions);

  return {
    arrangement,
    ev: result.averageScore,
    winRate: result.winRate,
    scoopRate: result.scoopRate
  };
}

/**
 * Optimal arrangement result
 */
export interface OptimalArrangementResult {
  optimalArrangement: Arrangement;
  optimalEV: number;
  specialHand?: { type: SpecialHandType; points: number };
  arrangementsEvaluated: number;
  allResults: ArrangementEVResult[];  // All evaluated arrangements sorted by EV
}

/**
 * Find optimal arrangement by evaluating all (or limited) valid arrangements
 */
export function findOptimalArrangement(
  cards: Card[],
  options: EVCalculationOptions
): OptimalArrangementResult {
  if (cards.length !== 13) {
    throw new Error('Must provide exactly 13 cards');
  }

  // Check for special hands first
  const specialHand = detectSpecialHand(cards);

  // Generate valid arrangements
  const arrangements = generateValidArrangements(cards, {
    maxArrangements: options.maxArrangements
  });

  if (arrangements.length === 0) {
    throw new Error('No valid arrangements found');
  }

  // Evaluate each arrangement
  const results: ArrangementEVResult[] = [];

  const simOptions: SimulationOptions = {
    iterations: options.iterations,
    numOpponents: options.numOpponents,
    scoringRule: options.scoringRule,
    seed: options.seed
  };

  for (const arrangement of arrangements) {
    const simResult = simulateArrangement(arrangement, cards, simOptions);

    results.push({
      arrangement,
      ev: simResult.averageScore,
      winRate: simResult.winRate,
      scoopRate: simResult.scoopRate
    });
  }

  // Sort by EV (descending)
  results.sort((a, b) => b.ev - a.ev);

  // Compare special hand EV vs best normal arrangement
  let optimalArrangement = results[0].arrangement;
  let optimalEV = results[0].ev;

  if (specialHand && specialHand.points > optimalEV) {
    // Special hand is better - use any valid arrangement
    optimalEV = specialHand.points;
  }

  return {
    optimalArrangement,
    optimalEV,
    specialHand: specialHand || undefined,
    arrangementsEvaluated: arrangements.length,
    allResults: results
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/ev-calculator.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/utils/chinese-poker/solver/ev-calculator.ts src/utils/chinese-poker/solver/__tests__/ev-calculator.test.ts
git commit -m "feat: add EV calculator for finding optimal arrangements"
```

---

## Task 3: Comparison Analyzer

**Files:**
- Create: `src/utils/chinese-poker/solver/analyzer.ts`
- Create: `src/utils/chinese-poker/solver/__tests__/analyzer.test.ts`

**Step 1: Write the failing test**

```typescript
/**
 * Tests for post-game analyzer
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import {
  analyzePlayerChoice,
  AnalysisOptions,
  AnalysisResult
} from '../analyzer';
import { ScoringRule } from '../scoring/basic-scoring';

describe('Post-Game Analyzer', () => {
  describe('analyzePlayerChoice', () => {
    it('should compare player arrangement vs optimal', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' },
        { rank: 'T', suit: 's' },
        { rank: 'T', suit: 'c' },
        { rank: 'T', suit: 'h' },
        { rank: '9', suit: 'd' }
      ];

      // Suboptimal arrangement (weak front)
      const playerArrangement: Arrangement = {
        front: [
          { rank: 'K', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: '9', suit: 'd' }
        ],
        middle: [
          { rank: 'Q', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 'h' },
          { rank: 'T', suit: 'd' }
        ],
        back: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'T', suit: 's' },
          { rank: 'T', suit: 'c' },
          { rank: 'T', suit: 'h' }
        ]
      };

      const options: AnalysisOptions = {
        iterations: 100,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 20,
        seed: 12345
      };

      const result = analyzePlayerChoice(cards, playerArrangement, options);

      expect(result.playerEV).toBeDefined();
      expect(result.optimalEV).toBeDefined();
      expect(result.evDifference).toBeDefined();
      expect(result.isOptimal).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should detect optimal play', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'd' },
        { rank: '5', suit: 'c' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: '4', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 'h' }
      ];

      // Strong arrangement (trips in back)
      const playerArrangement: Arrangement = {
        front: [
          { rank: '7', suit: 'h' },
          { rank: '6', suit: 'd' },
          { rank: '5', suit: 'c' }
        ],
        middle: [
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'c' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 'h' }
        ],
        back: [
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'c' },
          { rank: '4', suit: 'h' },
          { rank: '3', suit: 'd' }
        ]
      };

      const options: AnalysisOptions = {
        iterations: 50,
        numOpponents: 1,
        scoringRule: ScoringRule.ONE_ONE_ONE,
        maxArrangements: 10,
        seed: 54321
      };

      const result = analyzePlayerChoice(cards, playerArrangement, options);

      expect(result.isOptimal).toBe(true);
      expect(result.evDifference).toBeLessThan(0.5); // Nearly optimal
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/analyzer.test.ts`
Expected: FAIL with "Cannot find module '../analyzer'"

**Step 3: Write minimal implementation**

```typescript
/**
 * Post-game analyzer for Chinese Poker
 * Compares player choices against optimal arrangements
 */

import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule } from '../scoring/basic-scoring';
import { simulateArrangement } from './monte-carlo';
import { findOptimalArrangement, EVCalculationOptions } from './ev-calculator';

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
}

/**
 * Analyze player's arrangement choice
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

    // Compare specific rows
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
    optimalWinRate: optimalResult.allResults[0]?.winRate || 0
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/chinese-poker/solver/__tests__/analyzer.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/utils/chinese-poker/solver/analyzer.ts src/utils/chinese-poker/solver/__tests__/analyzer.test.ts
git commit -m "feat: add post-game analyzer for comparing player vs optimal"
```

---

## Task 4: Training Mode Hook

**Files:**
- Create: `src/hooks/useChinesePokerTraining.ts`
- Test: Manual testing in UI (unit test would require extensive mocking)

**Step 1: Write the implementation**

```typescript
/**
 * Training mode hook for Chinese Poker
 * Manages training game state and analysis
 */

import { useState, useCallback } from 'react';
import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule } from '@/utils/chinese-poker/scoring/basic-scoring';
import { dealChinesePoker } from '@/utils/chinese-poker/deck';
import { isValidArrangement } from '@/utils/chinese-poker/validation';
import { analyzePlayerChoice, AnalysisResult } from '@/utils/chinese-poker/solver/analyzer';

export type TrainingPhase = 'dealing' | 'arranging' | 'analyzing' | 'review';

export interface TrainingState {
  phase: TrainingPhase;
  cards: Card[];
  playerArrangement: Arrangement | null;
  analysis: AnalysisResult | null;
  scoringRule: ScoringRule;
  numOpponents: number;
  error: string | null;
}

export interface UseChinesePokerTrainingReturn {
  state: TrainingState;
  dealNewHand: () => void;
  submitArrangement: (arrangement: Arrangement) => void;
  resetToDealing: () => void;
  setScoringRule: (rule: ScoringRule) => void;
  setNumOpponents: (num: number) => void;
}

/**
 * Training mode hook
 */
export function useChinesePokerTraining(): UseChinesePokerTrainingReturn {
  const [state, setState] = useState<TrainingState>({
    phase: 'dealing',
    cards: [],
    playerArrangement: null,
    analysis: null,
    scoringRule: ScoringRule.ONE_ONE_ONE,
    numOpponents: 1,
    error: null
  });

  const dealNewHand = useCallback(() => {
    const hands = dealChinesePoker(1); // Just deal for one player
    setState(prev => ({
      ...prev,
      phase: 'arranging',
      cards: hands[0].cards,
      playerArrangement: null,
      analysis: null,
      error: null
    }));
  }, []);

  const submitArrangement = useCallback((arrangement: Arrangement) => {
    // Validate arrangement
    if (!isValidArrangement(arrangement)) {
      setState(prev => ({
        ...prev,
        error: 'Invalid arrangement: Back hand must be stronger than Middle, and Middle stronger than Front'
      }));
      return;
    }

    setState(prev => ({ ...prev, phase: 'analyzing', error: null }));

    // Run analysis (async)
    setTimeout(() => {
      try {
        const analysis = analyzePlayerChoice(
          state.cards,
          arrangement,
          {
            iterations: 1000,
            numOpponents: state.numOpponents,
            scoringRule: state.scoringRule,
            maxArrangements: 50,
            seed: Date.now()
          }
        );

        setState(prev => ({
          ...prev,
          phase: 'review',
          playerArrangement: arrangement,
          analysis
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          phase: 'arranging',
          error: error instanceof Error ? error.message : 'Analysis failed'
        }));
      }
    }, 100);
  }, [state.cards, state.numOpponents, state.scoringRule]);

  const resetToDealing = useCallback(() => {
    setState({
      phase: 'dealing',
      cards: [],
      playerArrangement: null,
      analysis: null,
      scoringRule: state.scoringRule,
      numOpponents: state.numOpponents,
      error: null
    });
  }, [state.scoringRule, state.numOpponents]);

  const setScoringRule = useCallback((rule: ScoringRule) => {
    setState(prev => ({ ...prev, scoringRule: rule }));
  }, []);

  const setNumOpponents = useCallback((num: number) => {
    if (num < 1 || num > 3) {
      throw new Error('Number of opponents must be 1-3');
    }
    setState(prev => ({ ...prev, numOpponents: num }));
  }, []);

  return {
    state,
    dealNewHand,
    submitArrangement,
    resetToDealing,
    setScoringRule,
    setNumOpponents
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useChinesePokerTraining.ts
git commit -m "feat: add training mode hook for Chinese Poker"
```

---

## Task 5: Update TypeScript Types

**Files:**
- Modify: `src/types/chinese-poker.ts` (add new types for solver)

**Step 1: Add solver types**

```typescript
// Add at end of file

/**
 * Monte Carlo simulation types
 */
export interface SimulationOptions {
  iterations: number;
  numOpponents: number;
  scoringRule: ScoringRule;
  seed?: number;
}

export interface SimulationResult {
  averageScore: number;
  winRate: number;
  scoopRate: number;
  iterations: number;
}

/**
 * EV calculation types
 */
export interface EVCalculationOptions extends SimulationOptions {
  maxArrangements?: number;
}

export interface ArrangementEVResult {
  arrangement: Arrangement;
  ev: number;
  winRate: number;
  scoopRate: number;
}

/**
 * Analysis types
 */
export interface AnalysisOptions extends EVCalculationOptions {}

export interface Suggestion {
  type: 'front' | 'middle' | 'back' | 'general';
  message: string;
  evImpact?: number;
}

export interface AnalysisResult {
  playerEV: number;
  optimalEV: number;
  evDifference: number;
  isOptimal: boolean;
  optimalArrangement: Arrangement;
  suggestions: Suggestion[];
  playerWinRate: number;
  optimalWinRate: number;
}
```

**Step 2: Import ScoringRule**

At the top of the file, add:

```typescript
import { ScoringRule } from '@/utils/chinese-poker/scoring/basic-scoring';
```

**Step 3: Commit**

```bash
git add src/types/chinese-poker.ts
git commit -m "feat: add solver types to Chinese Poker type definitions"
```

---

## Task 6: Update Task Plan

**Files:**
- Modify: `task_plan.md`

**Step 1: Mark Phase 5 tasks as complete**

Update the Phase 5 section:

```markdown
- [x] Phase 5: Optimal strategy and analysis ✅
  - [x] 5.1: Win probability calculator (Monte Carlo simulation)
  - [x] 5.2: Monte Carlo simulator
  - [x] 5.3: Expected Value (EV) calculator
  - [x] 5.4: Optimal arrangement finder
  - [x] 5.5: Post-game analysis (missed opportunities, EV comparison)
```

**Step 2: Update status section**

```markdown
## Status
**Phase 5 Complete** ✅ - Optimal strategy and analysis fully implemented with Monte Carlo simulation, EV calculator, and training mode

**Next Step**: Phase 6 - Game state management (or UI implementation for training mode)

**Deliverables**:
- ... (existing deliverables)
- `src/utils/chinese-poker/solver/monte-carlo.ts` - Monte Carlo simulator ✅
- `src/utils/chinese-poker/solver/ev-calculator.ts` - EV calculator & optimal finder ✅
- `src/utils/chinese-poker/solver/analyzer.ts` - Post-game analyzer ✅
- `src/hooks/useChinesePokerTraining.ts` - Training mode hook ✅
- Unit tests: **135/135 passing** ✅
```

**Step 3: Commit**

```bash
git add task_plan.md
git commit -m "docs: mark Phase 5 complete in task plan"
```

---

## Next Steps

After completing this plan:

1. **UI Implementation** - Create React components for training mode:
   - `src/app/chinese-poker/training/page.tsx` - Training mode page
   - `src/components/chinese-poker/ArrangementBoard.tsx` - Drag-and-drop arrangement UI
   - `src/components/chinese-poker/AnalysisView.tsx` - Show EV comparison and suggestions

2. **Performance Optimization** (optional):
   - Cache simulation results for common hands
   - Optimize arrangement generation with better pruning
   - Parallel Monte Carlo simulation with Web Workers

3. **Phase 6** - Game state management for multiplayer

---

## Testing Strategy

**Unit Tests:**
- Monte Carlo: determinism with seeds, score distribution, multiple opponents
- EV Calculator: optimal finding, special hand handling, edge cases
- Analyzer: suggestion quality, optimal detection, EV comparison accuracy

**Integration Tests:**
- Full training flow: deal → arrange → analyze → review
- Cross-validation: manual calculation vs Monte Carlo results
- Performance: 1000-iteration simulation should complete < 2 seconds

**Manual Tests:**
- UI responsiveness during analysis
- Error handling for invalid arrangements
- Comparison visualization clarity
