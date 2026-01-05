/**
 * Equity Calculator for poker solver
 * Calculates hand/range vs hand/range equity
 */

import { Card, getHandCombos, getRemainingCards, getCardsBitmask, getCardBitmask } from './cards';
import { evaluateHand, getHandValue, compareHandsHeadsUp } from './hand_evaluator';
import { RangeWeights, HandNotation, RANKS } from './types';

/**
 * Cache for precomputed equities
 */
const equityCache = new Map<string, number>();

/**
 * Calculate equity of hand1 vs hand2 on a given board
 * Returns equity for hand1 (0-1)
 */
export function calculateHandVsHandEquity(
  hand1: Card[],
  hand2: Card[],
  board: Card[]
): number {
  const cacheKey = `${cardArrayToKey(hand1)}_${cardArrayToKey(hand2)}_${cardArrayToKey(board)}`;
  if (equityCache.has(cacheKey)) {
    return equityCache.get(cacheKey)!;
  }
  
  // Check for card conflicts
  const allCards = [...hand1, ...hand2, ...board];
  const mask = getCardsBitmask(allCards);
  if (allCards.length !== countBits(mask)) {
    return 0; // Card conflict
  }
  
  let equity: number;
  
  if (board.length === 5) {
    // River - just compare hands
    equity = compareHandsHeadsUp(hand1, hand2, board);
  } else {
    // Run out remaining cards
    equity = runOutEquity(hand1, hand2, board);
  }
  
  equityCache.set(cacheKey, equity);
  return equity;
}

/**
 * Run out remaining board cards and calculate average equity
 */
function runOutEquity(
  hand1: Card[],
  hand2: Card[],
  board: Card[]
): number {
  const usedCards = [...hand1, ...hand2, ...board];
  const remaining = getRemainingCards(usedCards);
  const cardsNeeded = 5 - board.length;
  
  if (cardsNeeded === 0) {
    return compareHandsHeadsUp(hand1, hand2, board);
  }
  
  // Monte Carlo sampling for efficiency if many runouts
  const MAX_SAMPLES = 1000;
  const totalRunouts = binomial(remaining.length, cardsNeeded);
  
  if (totalRunouts <= MAX_SAMPLES) {
    // Full enumeration
    let totalEquity = 0;
    let count = 0;
    
    const runouts = getCombinations(remaining, cardsNeeded);
    for (const runout of runouts) {
      const fullBoard = [...board, ...runout];
      totalEquity += compareHandsHeadsUp(hand1, hand2, fullBoard);
      count++;
    }
    
    return count > 0 ? totalEquity / count : 0.5;
  } else {
    // Monte Carlo
    let totalEquity = 0;
    
    for (let i = 0; i < MAX_SAMPLES; i++) {
      const runout = sampleCards(remaining, cardsNeeded);
      const fullBoard = [...board, ...runout];
      totalEquity += compareHandsHeadsUp(hand1, hand2, fullBoard);
    }
    
    return totalEquity / MAX_SAMPLES;
  }
}

/**
 * Calculate equity of a hand vs a range
 */
export function calculateHandVsRangeEquity(
  hand: [Card, Card],
  rangeWeights: RangeWeights,
  board: Card[]
): number {
  const handMask = getCardsBitmask(hand);
  const boardMask = getCardsBitmask(board);
  
  let totalEquity = 0;
  let totalWeight = 0;
  
  // Iterate through all hands in range
  for (const [notation, weight] of Object.entries(rangeWeights)) {
    if (weight <= 0) continue;
    
    const combos = getHandCombos(notation, [...hand, ...board]);
    
    for (const opponentHand of combos) {
      const opponentMask = getCardsBitmask(opponentHand);
      
      // Check for blockers
      if ((handMask & opponentMask) !== BigInt(0)) continue;
      if ((boardMask & opponentMask) !== BigInt(0)) continue;
      
      const equity = calculateHandVsHandEquity(hand, opponentHand, board);
      totalEquity += equity * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? totalEquity / totalWeight : 0.5;
}

/**
 * Calculate equity of range vs range
 */
export function calculateRangeVsRangeEquity(
  range1: RangeWeights,
  range2: RangeWeights,
  board: Card[]
): { range1Equity: number; evDiff: number } {
  const boardMask = getCardsBitmask(board);
  
  let totalEquity = 0;
  let totalWeight = 0;
  
  for (const [notation1, weight1] of Object.entries(range1)) {
    if (weight1 <= 0) continue;
    
    const combos1 = getHandCombos(notation1, board);
    
    for (const hand1 of combos1) {
      const hand1Mask = getCardsBitmask(hand1);
      
      for (const [notation2, weight2] of Object.entries(range2)) {
        if (weight2 <= 0) continue;
        
        const combos2 = getHandCombos(notation2, [...board, ...hand1]);
        
        for (const hand2 of combos2) {
          const hand2Mask = getCardsBitmask(hand2);
          
          // Check for blockers
          if ((hand1Mask & hand2Mask) !== BigInt(0)) continue;
          
          const equity = calculateHandVsHandEquity(hand1, hand2, board);
          const combinedWeight = weight1 * weight2;
          
          totalEquity += equity * combinedWeight;
          totalWeight += combinedWeight;
        }
      }
    }
  }
  
  const range1Equity = totalWeight > 0 ? totalEquity / totalWeight : 0.5;
  return {
    range1Equity,
    evDiff: range1Equity - 0.5  // How much better than average
  };
}

/**
 * Get expected value for a hand in a pot given equity
 */
export function calculateEV(
  equity: number,
  pot: number,
  toCall: number = 0
): number {
  // EV = equity * (pot + toCall) - (1 - equity) * toCall
  return equity * (pot + toCall) - (1 - equity) * toCall;
}

/**
 * Calculate pot odds required to call
 */
export function calculatePotOdds(pot: number, toCall: number): number {
  return toCall / (pot + toCall);
}

// Helper functions

function cardArrayToKey(cards: Card[]): string {
  return cards.map(c => `${c.rank}${c.suit}`).sort().join('');
}

function countBits(n: bigint): number {
  let count = 0;
  while (n > 0) {
    count += Number(n & BigInt(1));
    n >>= BigInt(1);
  }
  return count;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, size);
  
  return [...withFirst, ...withoutFirst];
}

function sampleCards(cards: Card[], count: number): Card[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Clear the equity cache
 */
export function clearEquityCache(): void {
  equityCache.clear();
}
