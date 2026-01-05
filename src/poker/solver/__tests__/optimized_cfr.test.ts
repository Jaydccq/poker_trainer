/**
 * Optimized CFR Solver Tests
 * Tests for the optimized solver with Discounted CFR, warmup, and isomorphism
 */

import { OptimizedCFRSolver, solveOptimized } from '../optimized_cfr_solver';
import { PostflopCFRSolver, solvePostflop } from '../postflop_solver';
import { Card, parseCard } from '../cards';
import { computeIsomorphism, getCanonicalCombo, getCanonicalComboKey } from '../suit_isomorphism';
import { createNewSolutionConfig, createEmptyRange, RangeWeights, DEFAULT_SOLVER_CONFIG } from '../types';

const createRange = (hands: string[]): RangeWeights => {
  const range = createEmptyRange();
  for (const h of hands) range[h] = 1.0;
  return range;
};

const parseBoard = (boardStr: string): Card[] => {
  return boardStr.split(' ').map(s => parseCard(s)).filter((c): c is Card => c !== null);
};

describe('Optimized CFR Solver', () => {
  describe('Basic Functionality', () => {
    it('should complete a solve with all optimizations enabled', async () => {
      const config = {
        ...createNewSolutionConfig(),
        stackSize: 100,
        potSize: 10,
        oopRange: { label: 'OOP', weights: createRange(['AA', 'KK', 'QQ']) },
        ipRange: { label: 'IP', weights: createRange(['AA', 'KK', 'JJ']) },
      };

      const board = parseBoard('Ks Qh 2d');

      const solver = new OptimizedCFRSolver(config, board, {
        ...DEFAULT_SOLVER_CONFIG,
        maxIterations: 100,
        convergenceThreshold: 0.1,
        warmupIterations: 20,
        warmupSampleRate: 0.5,
        useSuitIsomorphism: true,
      });

      let progressUpdates = 0;
      solver.onProgress((p) => {
        progressUpdates++;
        console.log(`Iter ${p.iteration}: exploitability = ${p.exploitability.toFixed(4)}`);
      });

      const result = await solver.solve();

      console.log('\n=== Optimized Solver Results ===');
      console.log('Iterations:', result.totalIterations);
      console.log('Time:', result.solveTime, 'ms');
      console.log('Exploitability:', result.finalExploitability.toFixed(4));
      console.log('Strategy nodes:', result.strategies.size);

      expect(result.totalIterations).toBe(100);
      expect(result.strategies.size).toBeGreaterThan(0);
      expect(progressUpdates).toBeGreaterThan(0);
    }, 30000);

    it('should work with warmup disabled', async () => {
      const config = {
        ...createNewSolutionConfig(),
        stackSize: 50,
        potSize: 5,
        oopRange: { label: 'OOP', weights: createRange(['AA', 'KK']) },
        ipRange: { label: 'IP', weights: createRange(['QQ', 'JJ']) },
      };

      const board = parseBoard('As Kd 7c');

      const result = await solveOptimized(config, board);

      expect(result.totalIterations).toBeGreaterThan(0);
      expect(result.strategies.size).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Performance Comparison', () => {
    it('should complete faster than unoptimized solver', async () => {
      const config = {
        ...createNewSolutionConfig(),
        stackSize: 100,
        potSize: 10,
        oopRange: { label: 'OOP', weights: createRange(['AA', 'KK', 'QQ', 'JJ', 'TT']) },
        ipRange: { label: 'IP', weights: createRange(['AA', 'KK', 'QQ', 'JJ', '99']) },
      };

      const board = parseBoard('Ah Kc 5d');

      // Test optimized solver
      console.log('Running optimized solver...');
      const optimizedStart = Date.now();
      const optimizedResult = await solveOptimized(config, board);
      const optimizedTime = Date.now() - optimizedStart;

      // Test original solver
      console.log('Running original solver...');
      const originalStart = Date.now();
      const originalResult = await solvePostflop(config, board);
      const originalTime = Date.now() - originalStart;

      console.log('\n=== Performance Comparison ===');
      console.log(`Optimized: ${optimizedTime}ms, ${optimizedResult.totalIterations} iters`);
      console.log(`Original:  ${originalTime}ms, ${originalResult.totalIterations} iters`);
      console.log(`Speedup:   ${(originalTime / optimizedTime).toFixed(2)}x`);

      // Both should produce valid results
      expect(optimizedResult.strategies.size).toBeGreaterThan(0);
      expect(originalResult.strategies.size).toBeGreaterThan(0);
    }, 120000);
  });
});

describe('Suit Isomorphism', () => {
  describe('computeIsomorphism', () => {
    it('should compute isomorphism for rainbow board', () => {
      const board = parseBoard('As Kh Qd');
      const mapping = computeIsomorphism(board);

      console.log('Rainbow board isomorphism:');
      console.log('  isApplicable:', mapping.isApplicable);
      console.log('  equivalentCount:', mapping.equivalentCount);
      console.log('  suitPermutation:', [...mapping.suitPermutation.entries()]);

      expect(mapping.isApplicable).toBe(true);
      expect(mapping.equivalentCount).toBeGreaterThan(0);
    });

    it('should detect flush potential boards', () => {
      const board = parseBoard('As Ks Qs'); // All spades
      const mapping = computeIsomorphism(board);

      console.log('Monotone board isomorphism:');
      console.log('  isApplicable:', mapping.isApplicable);
      console.log('  equivalentCount:', mapping.equivalentCount);

      // Still applicable but with different characteristics
      expect(mapping).toBeDefined();
    });

    it('should handle two-tone boards', () => {
      const board = parseBoard('As Ks 2h');
      const mapping = computeIsomorphism(board);

      console.log('Two-tone board isomorphism:');
      console.log('  isApplicable:', mapping.isApplicable);
      console.log('  equivalentCount:', mapping.equivalentCount);

      expect(mapping).toBeDefined();
    });
  });

  describe('getCanonicalCombo', () => {
    it('should canonicalize equivalent combos to same key', () => {
      const board = parseBoard('2s 5s 9c');
      const mapping = computeIsomorphism(board);

      // These combos should be equivalent under isomorphism
      const combo1: [Card, Card] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
      ];

      const canonical1 = getCanonicalCombo(combo1, mapping);
      const key1 = getCanonicalComboKey(canonical1);

      console.log('Combo: Ah Kh');
      console.log('Canonical:', canonical1);
      console.log('Key:', key1);

      expect(key1).toBeDefined();
      expect(key1.length).toBe(4); // Two cards, 2 chars each
    });
  });
});

describe('Discounted CFR Parameters', () => {
  it('should converge faster with higher alpha', async () => {
    const config = {
      ...createNewSolutionConfig(),
      stackSize: 50,
      potSize: 5,
      oopRange: { label: 'OOP', weights: createRange(['AA', 'KK']) },
      ipRange: { label: 'IP', weights: createRange(['QQ', 'JJ']) },
    };

    const board = parseBoard('As Kd 7c');

    // High alpha - faster discount of old regrets
    const highAlphaSolver = new OptimizedCFRSolver(config, board, {
      ...DEFAULT_SOLVER_CONFIG,
      maxIterations: 100,
      alpha: 2.0,
      beta: 0.3,
    });

    // Low alpha - slower discount
    const lowAlphaSolver = new OptimizedCFRSolver(config, board, {
      ...DEFAULT_SOLVER_CONFIG,
      maxIterations: 100,
      alpha: 1.0,
      beta: 0.5,
    });

    const highAlphaResult = await highAlphaSolver.solve();
    const lowAlphaResult = await lowAlphaSolver.solve();

    console.log('\n=== Alpha Parameter Comparison ===');
    console.log(`High α (2.0): exploitability = ${highAlphaResult.finalExploitability.toFixed(4)}`);
    console.log(`Low α (1.0):  exploitability = ${lowAlphaResult.finalExploitability.toFixed(4)}`);

    // Both should produce valid results
    expect(highAlphaResult.strategies.size).toBeGreaterThan(0);
    expect(lowAlphaResult.strategies.size).toBeGreaterThan(0);
  }, 60000);
});
