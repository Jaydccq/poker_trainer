/**
 * Constants and utility functions for poker hands
 */
import { Rank, Suit, HandType, HandInfo, Position, RANKS } from './types';

// All suits
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

// All positions in order
export const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Position display names
export const POSITION_NAMES: Record<Position, { en: string; zh: string }> = {
  UTG: { en: 'Under the Gun', zh: '枪口位' },
  HJ: { en: 'Hijack', zh: '劫持位' },
  CO: { en: 'Cutoff', zh: '关煞位' },
  BTN: { en: 'Button', zh: '按钮位' },
  SB: { en: 'Small Blind', zh: '小盲位' },
  BB: { en: 'Big Blind', zh: '大盲位' },
};

// Rank to numeric value (for sorting/comparison)
export const RANK_VALUES: Record<Rank, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

/**
 * Generate the 13x13 hand matrix
 * Upper triangle = suited hands (AKs, AQs, etc.)
 * Diagonal = pocket pairs (AA, KK, etc.)
 * Lower triangle = offsuit hands (AKo, AQo, etc.)
 */
export function generateHandMatrix(): HandInfo[][] {
  const matrix: HandInfo[][] = [];
  
  for (let row = 0; row < 13; row++) {
    const rowData: HandInfo[] = [];
    for (let col = 0; col < 13; col++) {
      const rank1 = RANKS[row];
      const rank2 = RANKS[col];
      
      let type: HandType;
      let notation: string;
      
      if (row === col) {
        // Diagonal: pocket pairs
        type = 'pair';
        notation = `${rank1}${rank1}`;
      } else if (row < col) {
        // Upper triangle: suited
        type = 'suited';
        notation = `${rank1}${rank2}s`;
      } else {
        // Lower triangle: offsuit
        type = 'offsuit';
        notation = `${rank2}${rank1}o`;
      }
      
      rowData.push({
        notation,
        rank1: row < col ? rank1 : rank2,
        rank2: row < col ? rank2 : rank1,
        type,
        row,
        col,
      });
    }
    matrix.push(rowData);
  }
  
  return matrix;
}

/**
 * Get number of combinations for a hand type
 */
export function getCombos(type: HandType): number {
  switch (type) {
    case 'pair': return 6;    // C(4,2) = 6
    case 'suited': return 4;  // 4 suits
    case 'offsuit': return 12; // 4 * 3 = 12
  }
}

/**
 * Get hand type from notation
 */
export function getHandType(notation: string): HandType {
  if (notation.length === 2 && notation[0] === notation[1]) {
    return 'pair';
  }
  if (notation.endsWith('s')) {
    return 'suited';
  }
  return 'offsuit';
}

/**
 * Get row and column in matrix from hand notation
 */
export function getMatrixPosition(notation: string): { row: number; col: number } {
  const cleanNotation = notation.replace(/[so]$/, '');
  const rank1 = cleanNotation[0] as Rank;
  const rank2 = cleanNotation[1] as Rank;
  
  const idx1 = RANKS.indexOf(rank1);
  const idx2 = RANKS.indexOf(rank2);
  
  const type = getHandType(notation);
  
  if (type === 'pair') {
    return { row: idx1, col: idx1 };
  } else if (type === 'suited') {
    return { row: Math.min(idx1, idx2), col: Math.max(idx1, idx2) };
  } else {
    return { row: Math.max(idx1, idx2), col: Math.min(idx1, idx2) };
  }
}

/**
 * Cached hand matrix
 */
let cachedMatrix: HandInfo[][] | null = null;

export function getHandMatrix(): HandInfo[][] {
  if (!cachedMatrix) {
    cachedMatrix = generateHandMatrix();
  }
  return cachedMatrix;
}

// All 169 unique starting hands
export const ALL_HANDS: string[] = (() => {
  const hands: string[] = [];
  const matrix = generateHandMatrix();
  for (const row of matrix) {
    for (const cell of row) {
      hands.push(cell.notation);
    }
  }
  return hands;
})();

// Color constants for heatmap
export const HEATMAP_COLORS = {
  raise: { h: 142, s: 76, l: 36 },   // Green for raise
  call: { h: 45, s: 93, l: 47 },     // Yellow/gold for call
  fold: { h: 0, s: 0, l: 30 },       // Gray for fold
  mixed: { h: 200, s: 60, l: 50 },   // Blue for mixed
};

/**
 * Get heatmap color based on action frequencies
 */
export function getHeatmapColor(
  raiseFreq: number,
  callFreq: number,
  foldFreq: number
): string {
  // Determine primary action
  const maxFreq = Math.max(raiseFreq, callFreq, foldFreq);
  
  if (foldFreq === 1) {
    return `hsl(0, 0%, 25%)`;
  }
  
  if (raiseFreq >= 0.8) {
    const l = 30 + (raiseFreq - 0.8) * 50;
    return `hsl(142, 76%, ${l}%)`;
  }
  
  if (callFreq >= 0.8) {
    const l = 40 + (callFreq - 0.8) * 30;
    return `hsl(45, 93%, ${l}%)`;
  }
  
  // Mixed strategy - blend based on frequencies
  if (raiseFreq > callFreq && raiseFreq > foldFreq) {
    const intensity = raiseFreq;
    return `hsl(142, ${60 + intensity * 20}%, ${35 + intensity * 15}%)`;
  }
  
  if (callFreq > foldFreq) {
    const intensity = callFreq;
    return `hsl(45, ${70 + intensity * 25}%, ${45 + intensity * 10}%)`;
  }
  
  // Fold-heavy mixed
  const grayLevel = 25 + (1 - foldFreq) * 20;
  return `hsl(0, 0%, ${grayLevel}%)`;
}
