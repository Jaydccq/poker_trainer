/**
 * Quick Postflop Solver Test
 * Minimal test to verify solver works end-to-end
 */

import { PostflopCFRSolver } from '../postflop_solver';
import { Card } from '../cards';
import { createNewSolutionConfig, createEmptyRange, RangeWeights, DEFAULT_SOLVER_CONFIG } from '../types';

const createRange = (hands: string[]): RangeWeights => {
  const range = createEmptyRange();
  for (const h of hands) range[h] = 1.0;
  return range;
};

describe('Quick Postflop Test', () => {
  it('should complete a simple solve and return strategies', async () => {
    const config = {
      ...createNewSolutionConfig(),
      stackSize: 100,
      potSize: 10,
      oopRange: { label: 'OOP', weights: createRange(['AA', 'KK']) },
      ipRange: { label: 'IP', weights: createRange(['AA', 'QQ']) },
    };

    const board: Card[] = [
      { rank: 'K', suit: 's' },
      { rank: 'Q', suit: 'h' },
      { rank: '2', suit: 'd' },
    ];

    console.log('Starting quick postflop solve...');
    console.log('OOP: AA, KK | IP: AA, QQ | Board: Ks Qh 2d');

    const solver = new PostflopCFRSolver(config, board, {
      ...DEFAULT_SOLVER_CONFIG,
      maxIterations: 50,  // Very few iterations for speed
      convergenceThreshold: 0.5,
    });

    const result = await solver.solve();

    console.log('\n=== RESULT ===');
    console.log('Iterations:', result.totalIterations);
    console.log('Time:', result.solveTime, 'ms');
    console.log('Exploitability:', result.finalExploitability.toFixed(4));
    console.log('Strategy nodes:', result.strategies.size);

    // Check root node strategies
    const root = result.strategies.get('root');
    console.log('\n=== ROOT STRATEGIES ===');
    if (root) {
      for (const s of root.strategies) {
        console.log(`${s.hand}: check=${(s.actionFrequencies.check*100).toFixed(0)}% bet=${(s.actionFrequencies.bet*100).toFixed(0)}%`);
      }
    }

    // Verify results
    expect(result.totalIterations).toBe(50);
    expect(result.strategies.size).toBeGreaterThan(0);
    expect(root).toBeDefined();
    expect(root!.strategies.length).toBeGreaterThan(0);

    console.log('\n✅ Solver completed successfully!');
  }, 30000);
});
