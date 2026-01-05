/**
 * Postflop Solver Tests
 * Tests for CFR solver with flop/turn/river board cards
 */

import { PostflopCFRSolver, solvePostflop } from '../postflop_solver';
import { parseRangeString } from '../range_loader';
import { Card, parseCard } from '../cards';
import { createNewSolutionConfig, CustomSolutionConfig, RangeWeights, createEmptyRange, DEFAULT_SOLVER_CONFIG } from '../types';

describe('Postflop CFR Solver', () => {
  // Helper to create a simple range with specific hands
  const createSimpleRange = (hands: string[]): RangeWeights => {
    const range = createEmptyRange();
    for (const h of hands) {
      range[h] = 1.0;
    }
    return range;
  };

  // Helper to parse board cards
  const parseBoard = (boardStr: string): Card[] => {
    return boardStr.split(' ').map(s => parseCard(s)).filter((c): c is Card => c !== null);
  };

  describe('Basic Solver Functionality', () => {
    it('should solve a simple flop scenario', async () => {
      const config: CustomSolutionConfig = {
        ...createNewSolutionConfig(),
        stackSize: 100,
        potSize: 10,
        oopRange: {
          label: 'OOP',
          weights: createSimpleRange(['AA', 'KK', 'QQ', 'AKs', 'AKo']),
        },
        ipRange: {
          label: 'IP', 
          weights: createSimpleRange(['AA', 'KK', 'QQ', 'JJ', 'AKs']),
        },
      };

      const board = parseBoard('As Kd 7c');
      console.log('Board:', board);
      console.log('OOP Range:', Object.keys(config.oopRange.weights).filter(h => config.oopRange.weights[h] > 0));
      console.log('IP Range:', Object.keys(config.ipRange.weights).filter(h => config.ipRange.weights[h] > 0));

      const solver = new PostflopCFRSolver(config, board, {
        ...DEFAULT_SOLVER_CONFIG,
        maxIterations: 100,
        convergenceThreshold: 0.1,
      });

      let progressCount = 0;
      solver.onProgress((p) => {
        progressCount++;
        console.log(`Progress: Iter ${p.iteration}, Exploitability: ${p.exploitability.toFixed(4)}`);
      });

      const result = await solver.solve();

      console.log('\n=== Solver Results ===');
      console.log('Total iterations:', result.totalIterations);
      console.log('Final exploitability:', result.finalExploitability.toFixed(4));
      console.log('Solve time:', result.solveTime, 'ms');
      console.log('Number of strategy nodes:', result.strategies.size);

      // Verify we got some results
      expect(result.totalIterations).toBeGreaterThan(0);
      expect(result.strategies.size).toBeGreaterThan(0);

      // Log strategies at root node
      const rootStrategy = result.strategies.get('root');
      if (rootStrategy) {
        console.log('\n=== Root Node Strategies (OOP) ===');
        for (const handStrat of rootStrategy.strategies.slice(0, 10)) {
          console.log(`  ${handStrat.hand}: ` + 
            `check=${(handStrat.actionFrequencies.check * 100).toFixed(1)}% ` +
            `bet=${(handStrat.actionFrequencies.bet * 100).toFixed(1)}% ` +
            `allin=${(handStrat.actionFrequencies.allin * 100).toFixed(1)}%`);
        }
      }
    }, 30000); // 30 second timeout

    it('should solve with parsed preflop ranges', async () => {
      // BTN Open range vs BB Call range on a flop
      const btnOpenRange = parseRangeString(
        'AA,KK,QQ,JJ,TT,99,88,77,66,55,44,33,22,AK,AQ,AJ,AT,A9,A8,A7,A6,A5,A4,A3,A2s,KQ,KJ'
      );
      const bbCallRange = parseRangeString(
        'TT:0.05,99:0.35,88:0.45,77:0.6,66:0.9,55:0.85,44,33,22,AQo:0.45,AJs:0.3,AJo:0.65'
      );

      console.log('BTN Open hands:', Object.entries(btnOpenRange).filter(([_, v]) => v > 0).length);
      console.log('BB Call hands:', Object.entries(bbCallRange).filter(([_, v]) => v > 0).length);

      const config: CustomSolutionConfig = {
        ...createNewSolutionConfig(),
        stackSize: 50,
        potSize: 7,
        ipRange: { label: 'BTN', weights: btnOpenRange },
        oopRange: { label: 'BB', weights: bbCallRange },
      };

      const board = parseBoard('Qh 9s 4d');
      
      const result = await solvePostflop(config, board, (p) => {
        if (p.iteration % 50 === 0) {
          console.log(`Iter ${p.iteration}: exploitability = ${p.exploitability.toFixed(4)}`);
        }
      });

      console.log('\n=== Solution Summary ===');
      console.log('Iterations:', result.totalIterations);
      console.log('Time:', result.solveTime, 'ms');
      console.log('Exploitability:', result.finalExploitability.toFixed(4));
      console.log('Strategy nodes:', result.strategies.size);

      // Verify result structure
      expect(result.strategies.size).toBeGreaterThan(0);
      expect(result.solveTime).toBeGreaterThan(0);
    }, 60000);

    it('should handle turn and river boards', async () => {
      const config: CustomSolutionConfig = {
        ...createNewSolutionConfig(),
        stackSize: 30,
        potSize: 20,
        oopRange: {
          label: 'OOP',
          weights: createSimpleRange(['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs']),
        },
        ipRange: {
          label: 'IP',
          weights: createSimpleRange(['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs']),
        },
      };

      // Turn board (4 cards)
      const turnBoard = parseBoard('Ks Qh 7d 2c');
      console.log('Testing Turn Board:', turnBoard.map(c => `${c.rank}${c.suit}`).join(' '));

      const turnResult = await solvePostflop(config, turnBoard);
      console.log('Turn Result:', {
        iterations: turnResult.totalIterations,
        exploitability: turnResult.finalExploitability.toFixed(4),
        nodes: turnResult.strategies.size,
      });

      expect(turnResult.strategies.size).toBeGreaterThan(0);

      // River board (5 cards)
      const riverBoard = parseBoard('Ks Qh 7d 2c 8s');
      console.log('Testing River Board:', riverBoard.map(c => `${c.rank}${c.suit}`).join(' '));

      const riverResult = await solvePostflop(config, riverBoard);
      console.log('River Result:', {
        iterations: riverResult.totalIterations,
        exploitability: riverResult.finalExploitability.toFixed(4),
        nodes: riverResult.strategies.size,
      });

      expect(riverResult.strategies.size).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Strategy Extraction', () => {
    it('should extract meaningful strategies for different hands', async () => {
      // Create a scenario where we expect different strategies for different hands
      const config: CustomSolutionConfig = {
        ...createNewSolutionConfig(),
        stackSize: 100,
        potSize: 10,
        oopRange: {
          label: 'OOP',
          weights: createSimpleRange(['AA', 'KK', 'QQ', '22', '72o']),
        },
        ipRange: {
          label: 'IP',
          weights: createSimpleRange(['AA', 'KK', 'JJ', 'TT', 'AKs']),
        },
      };

      const board = parseBoard('Ah Kc 2d'); // AA and 22 both have sets!

      const result = await solvePostflop(config, board, (p) => {
        if (p.iteration % 25 === 0) {
          console.log(`Iter ${p.iteration}`);
        }
      });

      const rootNode = result.strategies.get('root');
      expect(rootNode).toBeDefined();

      if (rootNode) {
        console.log('\n=== Strategy Analysis on A-K-2 board ===');
        console.log('OOP strategies at root:');
        
        for (const hs of rootNode.strategies) {
          const { hand, actionFrequencies } = hs;
          const checkPct = (actionFrequencies.check * 100).toFixed(1);
          const betPct = (actionFrequencies.bet * 100).toFixed(1);
          const allinPct = (actionFrequencies.allin * 100).toFixed(1);
          
          console.log(`  ${hand.padEnd(4)}: check=${checkPct}% bet=${betPct}% allin=${allinPct}%`);
        }
      }

      expect(result.totalIterations).toBeGreaterThan(0);
    }, 30000);
  });
});

describe('Range Loading', () => {
  it('should correctly parse GTO range format', () => {
    const rangeStr = 'AA,KK,QQ:0.5,JJ:0.25,AKs,AQo:0.75';
    const weights = parseRangeString(rangeStr);

    expect(weights['AA']).toBe(1.0);
    expect(weights['KK']).toBe(1.0);
    expect(weights['QQ']).toBe(0.5);
    expect(weights['JJ']).toBe(0.25);
    expect(weights['AKs']).toBe(1.0);
    expect(weights['AQo']).toBe(0.75);
    expect(weights['72o']).toBe(0);

    console.log('Parsed range - hands with weight > 0:', 
      Object.entries(weights).filter(([_, v]) => v > 0).length);
  });

  it('should expand simplified notations', () => {
    // "AK" should expand to AKs and AKo
    const rangeStr = 'AK';
    const weights = parseRangeString(rangeStr);

    expect(weights['AKs']).toBe(1.0);
    expect(weights['AKo']).toBe(1.0);
  });
});
