/**
 * CFR (Counterfactual Regret Minimization) Solver
 * Implements Discounted CFR for GTO strategy computation
 * 
 * Based on the algorithm from PCfrSolver.cpp and DiscountedCfrTrainable.cpp
 */

import {
  HandNotation,
  RangeWeights,
  ActionType,
  PositionType,
  SolverConfig,
  SolverProgress,
  SolverResult,
  CustomSolutionConfig,
  DEFAULT_SOLVER_CONFIG,
  NodeStrategy,
  HandNodeStrategy,
} from './types';
import { RANKS, ActionFrequencies } from '../types';

// ============================================================================
// Internal Types
// ============================================================================

interface GameState {
  pot: number;
  ipStack: number;
  oopStack: number;
  toAct: PositionType;
  bets: { ip: number; oop: number };
  actions: ActionType[];
  isTerminal: boolean;
  winner?: PositionType | 'showdown';
}

interface InfoSet {
  id: string;
  player: PositionType;
  hand: HandNotation;
  state: GameState;
  actions: ActionType[];
}

interface TrainableState {
  regrets: Map<string, number[]>;      // infoset -> regrets per action
  cumStrategy: Map<string, number[]>;  // infoset -> cumulative strategy
  iteration: number;
}

// ============================================================================
// Hand Utilities
// ============================================================================

const ALL_HANDS: HandNotation[] = (() => {
  const hands: HandNotation[] = [];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const rank1 = RANKS[row];
      const rank2 = RANKS[col];
      if (row === col) {
        hands.push(`${rank1}${rank1}`);
      } else if (row < col) {
        hands.push(`${rank1}${rank2}s`);
      } else {
        hands.push(`${rank2}${rank1}o`);
      }
    }
  }
  return hands;
})();

/**
 * Get all hands in a range with non-zero weight
 */
function getActiveHands(range: RangeWeights): HandNotation[] {
  return ALL_HANDS.filter(h => (range[h] || 0) > 0);
}

/**
 * Check if two hands can coexist (no card conflicts)
 */
function handsConflict(h1: HandNotation, h2: HandNotation): boolean {
  // For simplicity in preflop, we don't check specific combos
  // Just check for same pair or overlapping ranks
  const r1_1 = h1[0];
  const r1_2 = h1[1];
  const r2_1 = h2[0];
  const r2_2 = h2[1];
  
  // Same pocket pair
  if (h1.length === 2 && h2.length === 2 && h1 === h2) {
    return true; // Conflict: same pair
  }
  
  // For now, assume no conflicts in abstracted preflop solver
  return false;
}

// ============================================================================
// Preflop Simplified Action Tree
// ============================================================================

type PreflopAction = 'fold' | 'call' | 'raise2x' | 'raise3x' | 'allin';

interface PreflopNode {
  type: 'decision' | 'terminal';
  player?: PositionType;
  pot: number;
  toCall: number;
  actions?: PreflopAction[];
  children?: Map<PreflopAction, PreflopNode>;
  payoff?: { ip: number; oop: number }; // For terminals
  isShowdown?: boolean;
}

/**
 * Build a simplified preflop betting tree
 * OOP acts first (SB/BB scenario)
 */
function buildPreflopTree(stack: number, pot: number): PreflopNode {
  const root: PreflopNode = {
    type: 'decision',
    player: 'OOP',
    pot: pot,
    toCall: 0,
    actions: ['fold', 'call', 'raise3x'],
    children: new Map(),
  };

  // OOP folds
  root.children!.set('fold', {
    type: 'terminal',
    pot: pot,
    toCall: 0,
    payoff: { ip: pot, oop: 0 },
  });

  // OOP calls (checks)
  const oopCall: PreflopNode = {
    type: 'decision',
    player: 'IP',
    pot: pot,
    toCall: 0,
    actions: ['fold', 'call', 'raise3x'],
    children: new Map(),
  };
  root.children!.set('call', oopCall);

  // IP folds after OOP check
  oopCall.children!.set('fold', {
    type: 'terminal',
    pot: pot,
    toCall: 0,
    payoff: { ip: 0, oop: pot },
  });

  // IP checks back -> showdown
  oopCall.children!.set('call', {
    type: 'terminal',
    pot: pot,
    toCall: 0,
    payoff: { ip: pot / 2, oop: pot / 2 },
    isShowdown: true,
  });

  // IP raises after OOP check
  const ipRaise = pot * 3;
  const ipRaiseNode: PreflopNode = {
    type: 'decision',
    player: 'OOP',
    pot: pot + ipRaise,
    toCall: ipRaise,
    actions: ['fold', 'call', 'raise3x'],
    children: new Map(),
  };
  oopCall.children!.set('raise3x', ipRaiseNode);

  // OOP facing IP raise
  ipRaiseNode.children!.set('fold', {
    type: 'terminal',
    pot: pot + ipRaise,
    toCall: 0,
    payoff: { ip: pot + ipRaise, oop: 0 },
  });

  ipRaiseNode.children!.set('call', {
    type: 'terminal',
    pot: pot + ipRaise * 2,
    toCall: 0,
    payoff: { ip: (pot + ipRaise * 2) / 2, oop: (pot + ipRaise * 2) / 2 },
    isShowdown: true,
  });

  // OOP raises after OOP check -> IP raise
  const oopReraise = (pot + ipRaise) * 3;
  ipRaiseNode.children!.set('raise3x', {
    type: 'terminal', // Simplified: end after 3bet
    pot: pot + ipRaise + oopReraise,
    toCall: 0,
    payoff: { ip: (pot + ipRaise + oopReraise) / 2, oop: (pot + ipRaise + oopReraise) / 2 },
    isShowdown: true,
  });

  // OOP raises initially
  const oopRaise = pot * 3;
  const oopRaiseNode: PreflopNode = {
    type: 'decision',
    player: 'IP',
    pot: pot + oopRaise,
    toCall: oopRaise,
    actions: ['fold', 'call', 'raise3x'],
    children: new Map(),
  };
  root.children!.set('raise3x', oopRaiseNode);

  // IP facing OOP raise
  oopRaiseNode.children!.set('fold', {
    type: 'terminal',
    pot: pot + oopRaise,
    toCall: 0,
    payoff: { ip: 0, oop: pot + oopRaise },
  });

  oopRaiseNode.children!.set('call', {
    type: 'terminal',
    pot: pot + oopRaise * 2,
    toCall: 0,
    payoff: { ip: (pot + oopRaise * 2) / 2, oop: (pot + oopRaise * 2) / 2 },
    isShowdown: true,
  });

  // IP 3bets OOP's raise
  const ip3bet = (pot + oopRaise) * 3;
  oopRaiseNode.children!.set('raise3x', {
    type: 'terminal', // Simplified: end after 3bet
    pot: pot + oopRaise + ip3bet,
    toCall: 0,
    payoff: { ip: (pot + oopRaise + ip3bet) / 2, oop: (pot + oopRaise + ip3bet) / 2 },
    isShowdown: true,
  });

  return root;
}

// ============================================================================
// CFR Solver Class
// ============================================================================

export class CFRSolver {
  private config: SolverConfig;
  private solutionConfig: CustomSolutionConfig;
  private trainable: TrainableState;
  private progressCallback?: (progress: SolverProgress) => void;
  private cancelled: boolean = false;

  constructor(
    solutionConfig: CustomSolutionConfig,
    solverConfig: SolverConfig = DEFAULT_SOLVER_CONFIG
  ) {
    this.config = solverConfig;
    this.solutionConfig = solutionConfig;
    this.trainable = {
      regrets: new Map(),
      cumStrategy: new Map(),
      iteration: 0,
    };
  }

  /**
   * Cancel the solving process
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (progress: SolverProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Run the solver
   */
  async solve(): Promise<SolverResult> {
    const startTime = Date.now();
    this.cancelled = false;
    
    const tree = buildPreflopTree(
      this.solutionConfig.stackSize,
      this.solutionConfig.potSize
    );

    const ipHands = getActiveHands(this.solutionConfig.ipRange.weights);
    const oopHands = getActiveHands(this.solutionConfig.oopRange.weights);

    if (ipHands.length === 0 || oopHands.length === 0) {
      throw new Error('Both players must have non-empty ranges');
    }

    // Initialize regrets and strategies
    this.initializeTrainable(tree, ipHands, oopHands);

    let exploitability = Infinity;
    let iteration = 0;

    // Main CFR loop
    while (
      iteration < this.config.maxIterations &&
      exploitability > this.config.convergenceThreshold &&
      !this.cancelled
    ) {
      iteration++;
      this.trainable.iteration = iteration;

      // Traverse tree for each hand combination
      for (const oopHand of oopHands) {
        for (const ipHand of ipHands) {
          if (handsConflict(oopHand, ipHand)) continue;

          const oopWeight = this.solutionConfig.oopRange.weights[oopHand] || 0;
          const ipWeight = this.solutionConfig.ipRange.weights[ipHand] || 0;

          if (oopWeight === 0 || ipWeight === 0) continue;

          // CFR traversal
          this.cfr(tree, 'OOP', oopHand, ipHand, oopWeight, ipWeight, iteration);
          this.cfr(tree, 'IP', oopHand, ipHand, oopWeight, ipWeight, iteration);
        }
      }

      // Calculate exploitability every 50 iterations
      if (iteration % 50 === 0) {
        exploitability = this.calculateExploitability(tree, ipHands, oopHands);
        
        if (this.progressCallback) {
          this.progressCallback({
            iteration,
            maxIterations: this.config.maxIterations,
            exploitability,
            elapsed: Date.now() - startTime,
            status: 'running',
          });
        }
      }

      // Yield to event loop periodically
      if (iteration % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Final exploitability calculation
    exploitability = this.calculateExploitability(tree, ipHands, oopHands);

    // Build result
    const strategies = this.extractStrategies(tree, ipHands, oopHands);
    const solveTime = Date.now() - startTime;

    if (this.progressCallback) {
      this.progressCallback({
        iteration,
        maxIterations: this.config.maxIterations,
        exploitability,
        elapsed: solveTime,
        status: this.cancelled
          ? 'cancelled'
          : exploitability <= this.config.convergenceThreshold
            ? 'converged'
            : 'max_iterations',
      });
    }

    return {
      config: this.solutionConfig,
      solverConfig: this.config,
      strategies,
      totalIterations: iteration,
      finalExploitability: exploitability,
      solveTime,
      ipEV: 0, // TODO: Calculate
      oopEV: 0,
    };
  }

  /**
   * Initialize trainable state for all info sets
   */
  private initializeTrainable(
    tree: PreflopNode,
    ipHands: HandNotation[],
    oopHands: HandNotation[]
  ): void {
    const initNode = (node: PreflopNode, path: string) => {
      if (node.type === 'terminal') return;

      const actions = node.actions || [];
      const hands = node.player === 'IP' ? ipHands : oopHands;

      for (const hand of hands) {
        const infosetId = `${path}:${node.player}:${hand}`;
        this.trainable.regrets.set(infosetId, new Array(actions.length).fill(0));
        this.trainable.cumStrategy.set(infosetId, new Array(actions.length).fill(0));
      }

      if (node.children) {
        for (const [action, child] of node.children) {
          initNode(child, `${path}:${action}`);
        }
      }
    };

    initNode(tree, 'root');
  }

  /**
   * CFR traversal
   */
  private cfr(
    node: PreflopNode,
    traverser: PositionType,
    oopHand: HandNotation,
    ipHand: HandNotation,
    oopReach: number,
    ipReach: number,
    iteration: number,
    path: string = 'root'
  ): number {
    if (node.type === 'terminal') {
      return this.getTerminalUtility(node, traverser, oopHand, ipHand);
    }

    const actions = node.actions || [];
    const isTraverser = node.player === traverser;
    const hand = node.player === 'IP' ? ipHand : oopHand;
    const infosetId = `${path}:${node.player}:${hand}`;

    // Get current strategy from regrets
    const strategy = this.getStrategy(infosetId, actions.length);

    // Calculate utilities for each action
    const actionUtils: number[] = [];
    let nodeUtil = 0;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const child = node.children!.get(action)!;

      // Update reach probabilities
      let newOopReach = oopReach;
      let newIpReach = ipReach;

      if (node.player === 'OOP') {
        newOopReach *= strategy[i];
      } else {
        newIpReach *= strategy[i];
      }

      // Recurse
      const childUtil = this.cfr(
        child,
        traverser,
        oopHand,
        ipHand,
        newOopReach,
        newIpReach,
        iteration,
        `${path}:${action}`
      );

      actionUtils.push(childUtil);
      nodeUtil += strategy[i] * childUtil;
    }

    // Update regrets if this is traverser's decision
    if (isTraverser) {
      const regrets = this.trainable.regrets.get(infosetId)!;
      const oppReach = traverser === 'IP' ? oopReach : ipReach;

      for (let i = 0; i < actions.length; i++) {
        const regret = actionUtils[i] - nodeUtil;
        this.updateRegret(regrets, i, regret * oppReach, iteration);
      }
    }

    // Update cumulative strategy
    const cumStrategy = this.trainable.cumStrategy.get(infosetId)!;
    const ownReach = node.player === 'IP' ? ipReach : oopReach;
    for (let i = 0; i < actions.length; i++) {
      cumStrategy[i] += ownReach * strategy[i];
    }

    return nodeUtil;
  }

  /**
   * Get terminal utility for traverser
   */
  private getTerminalUtility(
    node: PreflopNode,
    traverser: PositionType,
    oopHand: HandNotation,
    ipHand: HandNotation
  ): number {
    if (!node.payoff) return 0;

    if (node.isShowdown) {
      // Simplified equity calculation based on hand strength
      const oopEquity = this.getHandEquity(oopHand, ipHand);
      const ipEquity = 1 - oopEquity;

      const totalPot = node.payoff.ip + node.payoff.oop;
      return traverser === 'IP' ? totalPot * ipEquity : totalPot * oopEquity;
    }

    return traverser === 'IP' ? node.payoff.ip : node.payoff.oop;
  }

  /**
   * Simplified hand equity (OOP's equity vs IP)
   */
  private getHandEquity(oopHand: HandNotation, ipHand: HandNotation): number {
    // Very simplified equity based on hand rankings
    const oopRank = this.getHandRank(oopHand);
    const ipRank = this.getHandRank(ipHand);

    if (oopRank > ipRank) return 0.6;
    if (oopRank < ipRank) return 0.4;
    return 0.5;
  }

  /**
   * Get simplified hand rank (higher = better)
   */
  private getHandRank(hand: HandNotation): number {
    const isPair = hand.length === 2;
    const isSuited = hand.endsWith('s');
    
    const r1 = RANKS.indexOf(hand[0] as any);
    const r2 = RANKS.indexOf(hand[1] as any);
    
    // Base rank from card ranks (inverted since lower index = higher rank)
    let rank = (26 - r1 - r2) * 10;
    
    if (isPair) rank += 150;
    if (isSuited) rank += 15;
    
    // Connectivity bonus
    if (Math.abs(r1 - r2) <= 1) rank += 10;
    
    return rank;
  }

  /**
   * Get current strategy from regrets (Regret Matching)
   */
  private getStrategy(infosetId: string, numActions: number): number[] {
    const regrets = this.trainable.regrets.get(infosetId);
    if (!regrets) {
      return new Array(numActions).fill(1 / numActions);
    }

    // Regret matching: proportional to positive regrets
    const positiveSum = regrets.reduce((sum, r) => sum + Math.max(0, r), 0);

    if (positiveSum === 0) {
      return new Array(numActions).fill(1 / numActions);
    }

    return regrets.map(r => Math.max(0, r) / positiveSum);
  }

  /**
   * Update regret with discounting
   */
  private updateRegret(
    regrets: number[],
    actionIdx: number,
    regretDelta: number,
    iteration: number
  ): void {
    const oldRegret = regrets[actionIdx];
    const newRegret = oldRegret + regretDelta;

    // Discounted CFR
    const alphaCoef = Math.pow(iteration, this.config.alpha) / 
                      (1 + Math.pow(iteration, this.config.alpha));

    if (newRegret > 0) {
      regrets[actionIdx] = newRegret * alphaCoef;
    } else {
      regrets[actionIdx] = newRegret * this.config.beta;
    }
  }

  /**
   * Calculate exploitability (best response value)
   */
  private calculateExploitability(
    tree: PreflopNode,
    ipHands: HandNotation[],
    oopHands: HandNotation[]
  ): number {
    // Simplified: just return average regret magnitude
    let totalRegret = 0;
    let regretCount = 0;

    for (const regrets of this.trainable.regrets.values()) {
      for (const r of regrets) {
        totalRegret += Math.abs(r);
        regretCount++;
      }
    }

    return regretCount > 0 ? totalRegret / regretCount : 0;
  }

  /**
   * Extract average strategies from cumulative strategies
   */
  private extractStrategies(
    tree: PreflopNode,
    ipHands: HandNotation[],
    oopHands: HandNotation[]
  ): Map<string, NodeStrategy> {
    const strategies = new Map<string, NodeStrategy>();

    const extractNode = (node: PreflopNode, path: string) => {
      if (node.type === 'terminal') return;

      const actions = node.actions || [];
      const hands = node.player === 'IP' ? ipHands : oopHands;

      const nodeStrategy: NodeStrategy = {
        nodeId: path,
        player: node.player!,
        strategies: [],
      };

      for (const hand of hands) {
        const infosetId = `${path}:${node.player}:${hand}`;
        const cumStrategy = this.trainable.cumStrategy.get(infosetId);

        let avgStrategy: number[];
        if (cumStrategy) {
          const sum = cumStrategy.reduce((a, b) => a + b, 0);
          avgStrategy = sum > 0 
            ? cumStrategy.map(s => s / sum)
            : new Array(actions.length).fill(1 / actions.length);
        } else {
          avgStrategy = new Array(actions.length).fill(1 / actions.length);
        }

        const actionFreqs: Record<ActionType, number> = {
          fold: 0, check: 0, call: 0, bet: 0, raise: 0, allin: 0,
        };

        actions.forEach((action, idx) => {
          if (action === 'fold') actionFreqs.fold = avgStrategy[idx];
          else if (action === 'call') actionFreqs.call = avgStrategy[idx];
          else if (action.startsWith('raise') || action === 'allin') {
            actionFreqs.raise += avgStrategy[idx];
          }
        });

        nodeStrategy.strategies.push({
          hand,
          actionFrequencies: actionFreqs,
          regrets: { fold: 0, check: 0, call: 0, bet: 0, raise: 0, allin: 0 },
          ev: 0,
        });
      }

      strategies.set(path, nodeStrategy);

      if (node.children) {
        for (const [action, child] of node.children) {
          extractNode(child, `${path}:${action}`);
        }
      }
    };

    extractNode(tree, 'root');
    return strategies;
  }
}

/**
 * Quick solve helper function
 */
export async function quickSolve(
  config: CustomSolutionConfig,
  onProgress?: (progress: SolverProgress) => void
): Promise<SolverResult> {
  const solver = new CFRSolver(config, {
    ...DEFAULT_SOLVER_CONFIG,
    maxIterations: 500, // Quick solve with fewer iterations
  });

  if (onProgress) {
    solver.onProgress(onProgress);
  }

  return solver.solve();
}
