/**
 * Postflop CFR Solver
 * Full implementation with board cards, hand evaluation, and equity calculation
 */

import {
  CustomSolutionConfig,
  SolverConfig,
  SolverProgress,
  SolverResult,
  RangeWeights,
  PositionType,
  ActionType,
  DEFAULT_SOLVER_CONFIG,
  NodeStrategy,
  HandNodeStrategy,
  HandNotation,
  RANKS,
} from './types';
import { Card, getHandCombos, getCardsBitmask, cardToString } from './cards';
import { evaluateHand, getHandValue, compareHandsHeadsUp } from './hand_evaluator';
import { calculateHandVsHandEquity } from './equity';

// ============================================================================
// Types
// ============================================================================

/**
 * Game tree node types
 */
type NodeType = 'action' | 'chance' | 'terminal';

/**
 * Game tree node for postflop solving
 */
interface GameNode {
  id: string;
  type: NodeType;
  street: 'flop' | 'turn' | 'river';
  player?: PositionType;
  pot: number;
  stack: number;
  actions?: string[];
  children?: Map<string, GameNode>;
  // For terminals
  isShowdown?: boolean;
  foldingPlayer?: PositionType;
}

/**
 * Trainable state for CFR
 */
interface TrainableState {
  regrets: Map<string, number[]>;
  cumStrategy: Map<string, number[]>;
  iteration: number;
}

/**
 * Combo representation for range
 */
interface Combo {
  notation: HandNotation;
  cards: [Card, Card];
  weight: number;
}

// ============================================================================
// Utility Functions
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
 * Get all active combos from a range, accounting for board blockers
 */
function getRangeCombos(weights: RangeWeights, boardCards: Card[]): Combo[] {
  const combos: Combo[] = [];
  
  for (const notation of ALL_HANDS) {
    const weight = weights[notation] || 0;
    if (weight <= 0) continue;
    
    const handCombos = getHandCombos(notation, boardCards);
    for (const cards of handCombos) {
      combos.push({
        notation,
        cards: cards as [Card, Card],
        weight,
      });
    }
  }
  
  return combos;
}

/**
 * Check if two combos have conflicting cards
 */
function combosConflict(c1: Combo, c2: Combo): boolean {
  const mask1 = getCardsBitmask(c1.cards);
  const mask2 = getCardsBitmask(c2.cards);
  return (mask1 & mask2) !== BigInt(0);
}

// ============================================================================
// Game Tree Builder
// ============================================================================

/**
 * Build postflop action tree
 */
function buildPostflopTree(
  config: CustomSolutionConfig,
  street: 'flop' | 'turn' | 'river',
  pot: number,
  stack: number
): GameNode {
  const streets: ('flop' | 'turn' | 'river')[] = ['flop', 'turn', 'river'];
  const streetIdx = streets.indexOf(street);
  
  function buildActionNode(
    id: string,
    player: PositionType,
    currentPot: number,
    currentStack: number,
    currentStreet: typeof street,
    facingBet: number
  ): GameNode {
    const actions: string[] = [];
    
    if (facingBet === 0) {
      // Can check or bet
      actions.push('check');
      
      // Add bet sizes
      const betSizes = [0.33, 0.5, 0.75, 1.0]; // pot fractions
      for (const size of betSizes) {
        const betAmount = Math.min(currentPot * size, currentStack);
        if (betAmount > 0) {
          actions.push(`bet_${size}`);
        }
      }
      
      // All-in
      if (currentStack > 0) {
        actions.push('allin');
      }
    } else {
      // Facing bet - can fold, call, or raise
      actions.push('fold');
      
      if (facingBet <= currentStack) {
        actions.push('call');
      }
      
      // Raise sizes
      if (currentStack > facingBet) {
        const raiseSizes = [2.0, 3.0]; // multiples of bet
        for (const mult of raiseSizes) {
          const raiseAmount = facingBet * mult;
          if (raiseAmount <= currentStack) {
            actions.push(`raise_${mult}x`);
          }
        }
        actions.push('allin');
      }
    }
    
    const node: GameNode = {
      id,
      type: 'action',
      street: currentStreet,
      player,
      pot: currentPot,
      stack: currentStack,
      actions,
      children: new Map(),
    };
    
    const nextPlayer = player === 'OOP' ? 'IP' : 'OOP';
    
    for (const action of actions) {
      if (action === 'check') {
        if (player === 'IP') {
          // Both checked - go to next street or showdown
          const nextStreetIdx = streets.indexOf(currentStreet) + 1;
          if (nextStreetIdx < streets.length) {
            // Next street - OOP acts first
            const childNode = buildActionNode(
              `${id}:check`,
              'OOP',
              currentPot,
              currentStack,
              streets[nextStreetIdx],
              0
            );
            node.children!.set('check', childNode);
          } else {
            // Showdown
            node.children!.set('check', {
              id: `${id}:check`,
              type: 'terminal',
              street: currentStreet,
              pot: currentPot,
              stack: currentStack,
              isShowdown: true,
            });
          }
        } else {
          // IP to act
          const childNode = buildActionNode(
            `${id}:check`,
            'IP',
            currentPot,
            currentStack,
            currentStreet,
            0
          );
          node.children!.set('check', childNode);
        }
      } else if (action === 'fold') {
        node.children!.set('fold', {
          id: `${id}:fold`,
          type: 'terminal',
          street: currentStreet,
          pot: currentPot,
          stack: currentStack,
          foldingPlayer: player,
        });
      } else if (action === 'call') {
        const newPot = currentPot + facingBet;
        const newStack = currentStack - facingBet;
        
        if (player === 'IP') {
          // Move to next street or showdown
          const nextStreetIdx = streets.indexOf(currentStreet) + 1;
          if (nextStreetIdx < streets.length) {
            const childNode = buildActionNode(
              `${id}:call`,
              'OOP',
              newPot,
              newStack,
              streets[nextStreetIdx],
              0
            );
            node.children!.set('call', childNode);
          } else {
            node.children!.set('call', {
              id: `${id}:call`,
              type: 'terminal',
              street: currentStreet,
              pot: newPot,
              stack: newStack,
              isShowdown: true,
            });
          }
        } else {
          // OOP called IP's bet - move to next street or showdown
          const nextStreetIdx = streets.indexOf(currentStreet) + 1;
          if (nextStreetIdx < streets.length) {
            const childNode = buildActionNode(
              `${id}:call`,
              'OOP',
              newPot,
              newStack,
              streets[nextStreetIdx],
              0
            );
            node.children!.set('call', childNode);
          } else {
            node.children!.set('call', {
              id: `${id}:call`,
              type: 'terminal',
              street: currentStreet,
              pot: newPot,
              stack: newStack,
              isShowdown: true,
            });
          }
        }
      } else if (action.startsWith('bet_')) {
        const sizeFrac = parseFloat(action.split('_')[1]);
        const betAmount = Math.round(currentPot * sizeFrac * 100) / 100;
        const newPot = currentPot + betAmount;
        const newStack = currentStack - betAmount;
        
        const childNode = buildActionNode(
          `${id}:${action}`,
          nextPlayer,
          newPot,
          newStack,
          currentStreet,
          betAmount
        );
        node.children!.set(action, childNode);
      } else if (action.startsWith('raise_')) {
        const mult = parseFloat(action.split('_')[1].replace('x', ''));
        const raiseAmount = Math.round(facingBet * mult * 100) / 100;
        const totalBet = raiseAmount;
        const newPot = currentPot + totalBet;
        const newStack = currentStack - totalBet;
        
        const childNode = buildActionNode(
          `${id}:${action}`,
          nextPlayer,
          newPot,
          newStack,
          currentStreet,
          totalBet
        );
        node.children!.set(action, childNode);
      } else if (action === 'allin') {
        const allinAmount = currentStack;
        const newPot = currentPot + allinAmount;
        
        // After all-in, opponent can only call or fold
        node.children!.set('allin', {
          id: `${id}:allin`,
          type: 'action',
          street: currentStreet,
          player: nextPlayer,
          pot: newPot,
          stack: 0,
          actions: ['fold', 'call'],
          children: new Map([
            ['fold', {
              id: `${id}:allin:fold`,
              type: 'terminal',
              street: currentStreet,
              pot: newPot,
              stack: 0,
              foldingPlayer: nextPlayer,
            }],
            ['call', {
              id: `${id}:allin:call`,
              type: 'terminal',
              street: currentStreet,
              pot: newPot + allinAmount,
              stack: 0,
              isShowdown: true,
            }],
          ]),
        });
      }
    }
    
    return node;
  }
  
  return buildActionNode('root', 'OOP', pot, stack, street, 0);
}

// ============================================================================
// Postflop CFR Solver
// ============================================================================

export class PostflopCFRSolver {
  private config: SolverConfig;
  private solutionConfig: CustomSolutionConfig;
  private board: Card[];
  private trainable: TrainableState;
  private progressCallback?: (progress: SolverProgress) => void;
  private cancelled: boolean = false;
  
  // Cached combos
  private oopCombos: Combo[] = [];
  private ipCombos: Combo[] = [];

  constructor(
    solutionConfig: CustomSolutionConfig,
    board: Card[],
    solverConfig: SolverConfig = DEFAULT_SOLVER_CONFIG
  ) {
    this.config = solverConfig;
    this.solutionConfig = solutionConfig;
    this.board = board;
    this.trainable = {
      regrets: new Map(),
      cumStrategy: new Map(),
      iteration: 0,
    };
  }

  cancel(): void {
    this.cancelled = true;
  }

  onProgress(callback: (progress: SolverProgress) => void): void {
    this.progressCallback = callback;
  }

  async solve(): Promise<SolverResult> {
    const startTime = Date.now();
    this.cancelled = false;
    
    // Get starting street based on board
    const street = this.board.length === 3 ? 'flop' 
                 : this.board.length === 4 ? 'turn' 
                 : 'river';
    
    // Build action tree
    const tree = buildPostflopTree(
      this.solutionConfig,
      street,
      this.solutionConfig.potSize,
      this.solutionConfig.stackSize
    );
    
    // Get combos for each player
    this.oopCombos = getRangeCombos(
      this.solutionConfig.oopRange.weights,
      this.board
    );
    this.ipCombos = getRangeCombos(
      this.solutionConfig.ipRange.weights,
      this.board
    );
    
    if (this.oopCombos.length === 0 || this.ipCombos.length === 0) {
      throw new Error('Both players must have non-empty ranges after board blockers');
    }
    
    // Initialize trainable state
    this.initializeTrainable(tree);
    
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
      
      // Traverse for each combo pair
      for (const oopCombo of this.oopCombos) {
        for (const ipCombo of this.ipCombos) {
          if (combosConflict(oopCombo, ipCombo)) continue;
          
          // CFR for both players
          this.cfr(tree, 'OOP', oopCombo, ipCombo, oopCombo.weight, ipCombo.weight, iteration);
          this.cfr(tree, 'IP', oopCombo, ipCombo, oopCombo.weight, ipCombo.weight, iteration);
        }
      }
      
      // Progress update
      if (iteration % 25 === 0) {
        exploitability = this.calculateExploitability();
        
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
      
      // Yield to event loop
      if (iteration % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Final calculation
    exploitability = this.calculateExploitability();
    const strategies = this.extractStrategies(tree);
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
      ipEV: 0,
      oopEV: 0,
    };
  }

  private initializeTrainable(tree: GameNode): void {
    const initNode = (node: GameNode) => {
      if (node.type === 'terminal') return;
      
      const actions = node.actions || [];
      if (actions.length === 0) return;
      
      // Initialize for each combo
      const combos = node.player === 'IP' ? this.ipCombos : this.oopCombos;
      for (const combo of combos) {
        const key = `${node.id}_${combo.notation}`;
        this.trainable.regrets.set(key, new Array(actions.length).fill(0));
        this.trainable.cumStrategy.set(key, new Array(actions.length).fill(0));
      }
      
      if (node.children) {
        for (const child of node.children.values()) {
          initNode(child);
        }
      }
    };
    
    initNode(tree);
  }

  private cfr(
    node: GameNode,
    traverser: PositionType,
    oopCombo: Combo,
    ipCombo: Combo,
    oopReach: number,
    ipReach: number,
    iteration: number
  ): number {
    if (node.type === 'terminal') {
      return this.getTerminalUtility(node, traverser, oopCombo, ipCombo);
    }
    
    const actions = node.actions || [];
    if (actions.length === 0) return 0;
    
    const isTraverser = node.player === traverser;
    const combo = node.player === 'IP' ? ipCombo : oopCombo;
    const key = `${node.id}_${combo.notation}`;
    
    const strategy = this.getStrategy(key, actions.length);
    
    // Calculate action utilities
    const actionUtils: number[] = [];
    let nodeUtil = 0;
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const child = node.children!.get(action);
      if (!child) continue;
      
      let newOopReach = oopReach;
      let newIpReach = ipReach;
      
      if (node.player === 'OOP') {
        newOopReach *= strategy[i];
      } else {
        newIpReach *= strategy[i];
      }
      
      const childUtil = this.cfr(
        child,
        traverser,
        oopCombo,
        ipCombo,
        newOopReach,
        newIpReach,
        iteration
      );
      
      actionUtils.push(childUtil);
      nodeUtil += strategy[i] * childUtil;
    }
    
    // Update regrets for traverser
    if (isTraverser) {
      const regrets = this.trainable.regrets.get(key)!;
      const oppReach = traverser === 'IP' ? oopReach : ipReach;
      
      for (let i = 0; i < actions.length; i++) {
        const regret = (actionUtils[i] || 0) - nodeUtil;
        this.updateRegret(regrets, i, regret * oppReach, iteration);
      }
    }
    
    // Update cumulative strategy
    const cumStrategy = this.trainable.cumStrategy.get(key)!;
    const ownReach = node.player === 'IP' ? ipReach : oopReach;
    for (let i = 0; i < actions.length; i++) {
      cumStrategy[i] += ownReach * strategy[i];
    }
    
    return nodeUtil;
  }

  private getTerminalUtility(
    node: GameNode,
    traverser: PositionType,
    oopCombo: Combo,
    ipCombo: Combo
  ): number {
    const pot = node.pot;
    
    if (node.foldingPlayer) {
      // Someone folded
      const winner = node.foldingPlayer === 'OOP' ? 'IP' : 'OOP';
      return traverser === winner ? pot : 0;
    }
    
    if (node.isShowdown) {
      // Showdown - evaluate hands
      const oopHand = [...oopCombo.cards, ...this.board];
      const ipHand = [...ipCombo.cards, ...this.board];
      
      const equity = calculateHandVsHandEquity(
        oopCombo.cards,
        ipCombo.cards,
        this.board
      );
      
      if (traverser === 'OOP') {
        return pot * equity;
      } else {
        return pot * (1 - equity);
      }
    }
    
    return 0;
  }

  private getStrategy(key: string, numActions: number): number[] {
    const regrets = this.trainable.regrets.get(key);
    if (!regrets) {
      return new Array(numActions).fill(1 / numActions);
    }
    
    const positiveSum = regrets.reduce((sum, r) => sum + Math.max(0, r), 0);
    
    if (positiveSum === 0) {
      return new Array(numActions).fill(1 / numActions);
    }
    
    return regrets.map(r => Math.max(0, r) / positiveSum);
  }

  private updateRegret(
    regrets: number[],
    actionIdx: number,
    regretDelta: number,
    iteration: number
  ): void {
    const oldRegret = regrets[actionIdx];
    const newRegret = oldRegret + regretDelta;
    
    const alphaCoef = Math.pow(iteration, this.config.alpha) /
                      (1 + Math.pow(iteration, this.config.alpha));
    
    if (newRegret > 0) {
      regrets[actionIdx] = newRegret * alphaCoef;
    } else {
      regrets[actionIdx] = newRegret * this.config.beta;
    }
  }

  private calculateExploitability(): number {
    let totalRegret = 0;
    let count = 0;
    
    for (const regrets of this.trainable.regrets.values()) {
      for (const r of regrets) {
        totalRegret += Math.abs(r);
        count++;
      }
    }
    
    return count > 0 ? totalRegret / count : 0;
  }

  private extractStrategies(tree: GameNode): Map<string, NodeStrategy> {
    const strategies = new Map<string, NodeStrategy>();
    
    const extractNode = (node: GameNode) => {
      if (node.type === 'terminal') return;
      
      const actions = node.actions || [];
      if (actions.length === 0) return;
      
      const combos = node.player === 'IP' ? this.ipCombos : this.oopCombos;
      
      const nodeStrategy: NodeStrategy = {
        nodeId: node.id,
        player: node.player!,
        strategies: [],
      };
      
      for (const combo of combos) {
        const key = `${node.id}_${combo.notation}`;
        const cumStrategy = this.trainable.cumStrategy.get(key);
        
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
          else if (action === 'check') actionFreqs.check = avgStrategy[idx];
          else if (action === 'call') actionFreqs.call = avgStrategy[idx];
          else if (action.startsWith('bet')) actionFreqs.bet += avgStrategy[idx];
          else if (action.startsWith('raise')) actionFreqs.raise += avgStrategy[idx];
          else if (action === 'allin') actionFreqs.allin = avgStrategy[idx];
        });
        
        nodeStrategy.strategies.push({
          hand: combo.notation,
          actionFrequencies: actionFreqs,
          regrets: { fold: 0, check: 0, call: 0, bet: 0, raise: 0, allin: 0 },
          ev: 0,
        });
      }
      
      strategies.set(node.id, nodeStrategy);
      
      if (node.children) {
        for (const child of node.children.values()) {
          extractNode(child);
        }
      }
    };
    
    extractNode(tree);
    return strategies;
  }
}

/**
 * Quick postflop solve helper
 */
export async function solvePostflop(
  config: CustomSolutionConfig,
  board: Card[],
  onProgress?: (progress: SolverProgress) => void
): Promise<SolverResult> {
  const solver = new PostflopCFRSolver(config, board, {
    ...DEFAULT_SOLVER_CONFIG,
    maxIterations: 300,
  });
  
  if (onProgress) {
    solver.onProgress(onProgress);
  }
  
  return solver.solve();
}
