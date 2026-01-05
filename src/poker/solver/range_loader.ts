/**
 * Range Loader - Parse and load preflop ranges from text files
 * Supports format: "AA,AKs,AQo:0.5,JJ:0.75"
 */

import { RangeWeights, createEmptyRange, HandNotation } from './types';

/**
 * Preflop scenario definition
 */
export interface PreflopScenario {
  id: string;
  filename: string;
  name: string;
  nameZh: string;
  position: string;
  vsPosition?: string;
  action: string;
  category: 'open' | 'call' | '3bet' | '4bet' | '4b_call' | 'other';
}

/**
 * All available preflop scenarios from preflopRanges directory
 */
export const PREFLOP_SCENARIOS: PreflopScenario[] = [
  // Opening ranges
  { id: 'BU', filename: 'BU.txt', name: 'BTN Open', nameZh: 'BTN开池', position: 'BTN', action: 'Open', category: 'open' },
  { id: 'CO', filename: 'CO.txt', name: 'CO Open', nameZh: 'CO开池', position: 'CO', action: 'Open', category: 'open' },
  { id: 'HJ', filename: 'HJ.txt', name: 'HJ Open', nameZh: 'HJ开池', position: 'HJ', action: 'Open', category: 'open' },
  { id: 'LJ', filename: 'LJ.txt', name: 'LJ Open', nameZh: 'LJ开池', position: 'LJ', action: 'Open', category: 'open' },
  { id: 'SB', filename: 'SB.txt', name: 'SB Open', nameZh: 'SB开池', position: 'SB', action: 'Open', category: 'open' },
  
  // BB vs BU scenarios
  { id: 'BBvBUcall', filename: 'BBvBUcall.txt', name: 'BB vs BTN Call', nameZh: 'BB对BTN跟注', position: 'BB', vsPosition: 'BTN', action: 'Call', category: 'call' },
  { id: 'BBvBU3bet', filename: 'BBvBU3bet.txt', name: 'BB vs BTN 3bet', nameZh: 'BB对BTN 3bet', position: 'BB', vsPosition: 'BTN', action: '3bet', category: '3bet' },
  { id: 'BBvBU4bcall', filename: 'BBvBU4bcall.txt', name: 'BB vs BTN 4bet Call', nameZh: 'BB对BTN跟4bet', position: 'BB', vsPosition: 'BTN', action: '4bet Call', category: '4b_call' },
  
  // BB vs CO scenarios
  { id: 'BBvCOcall', filename: 'BBvCOcall.txt', name: 'BB vs CO Call', nameZh: 'BB对CO跟注', position: 'BB', vsPosition: 'CO', action: 'Call', category: 'call' },
  { id: 'BBvCO3bet', filename: 'BBvCO3bet.txt', name: 'BB vs CO 3bet', nameZh: 'BB对CO 3bet', position: 'BB', vsPosition: 'CO', action: '3bet', category: '3bet' },
  
  // BB vs HJ scenarios
  { id: 'BBvHJcall', filename: 'BBvHJcall.txt', name: 'BB vs HJ Call', nameZh: 'BB对HJ跟注', position: 'BB', vsPosition: 'HJ', action: 'Call', category: 'call' },
  { id: 'BBvHJ3bet', filename: 'BBvHJ3bet.txt', name: 'BB vs HJ 3bet', nameZh: 'BB对HJ 3bet', position: 'BB', vsPosition: 'HJ', action: '3bet', category: '3bet' },
  { id: 'BBvHJ4bcall', filename: 'BBvHJ4bcall.txt', name: 'BB vs HJ 4bet Call', nameZh: 'BB对HJ跟4bet', position: 'BB', vsPosition: 'HJ', action: '4bet Call', category: '4b_call' },
  
  // BB vs LJ scenarios
  { id: 'BBvLJcall', filename: 'BBvLJcall.txt', name: 'BB vs LJ Call', nameZh: 'BB对LJ跟注', position: 'BB', vsPosition: 'LJ', action: 'Call', category: 'call' },
  { id: 'BBvLJ3bet', filename: 'BBvLJ3bet.txt', name: 'BB vs LJ 3bet', nameZh: 'BB对LJ 3bet', position: 'BB', vsPosition: 'LJ', action: '3bet', category: '3bet' },
  
  // BB vs SB scenarios
  { id: 'BBvSBcall', filename: 'BBvSBcall.txt', name: 'BB vs SB Call', nameZh: 'BB对SB跟注', position: 'BB', vsPosition: 'SB', action: 'Call', category: 'call' },
  { id: 'BBvSB3bet', filename: 'BBvSB3bet.txt', name: 'BB vs SB 3bet', nameZh: 'BB对SB 3bet', position: 'BB', vsPosition: 'SB', action: '3bet', category: '3bet' },
  { id: 'BBvSB4bcall', filename: 'BBvSB4bcall.txt', name: 'BB vs SB 4bet Call', nameZh: 'BB对SB跟4bet', position: 'BB', vsPosition: 'SB', action: '4bet Call', category: '4b_call' },
  
  // BTN vs scenarios
  { id: 'BUvBB3bcall', filename: 'BUvBB3bcall.txt', name: 'BTN vs BB 3bet Call', nameZh: 'BTN对BB跟3bet', position: 'BTN', vsPosition: 'BB', action: '3bet Call', category: '4b_call' },
  { id: 'BUvBB4b', filename: 'BUvBB4b.txt', name: 'BTN vs BB 4bet', nameZh: 'BTN对BB 4bet', position: 'BTN', vsPosition: 'BB', action: '4bet', category: '4bet' },
  { id: 'BUvCOcall', filename: 'BUvCOcall.txt', name: 'BTN vs CO Call', nameZh: 'BTN对CO跟注', position: 'BTN', vsPosition: 'CO', action: 'Call', category: 'call' },
  { id: 'BUvCO3bet', filename: 'BUvCO3bet.txt', name: 'BTN vs CO 3bet', nameZh: 'BTN对CO 3bet', position: 'BTN', vsPosition: 'CO', action: '3bet', category: '3bet' },
  { id: 'BUvHJcall', filename: 'BUvHJcall.txt', name: 'BTN vs HJ Call', nameZh: 'BTN对HJ跟注', position: 'BTN', vsPosition: 'HJ', action: 'Call', category: 'call' },
  { id: 'BUvHJ3b', filename: 'BUvHJ3b.txt', name: 'BTN vs HJ 3bet', nameZh: 'BTN对HJ 3bet', position: 'BTN', vsPosition: 'HJ', action: '3bet', category: '3bet' },
  { id: 'BUvHJ4bcall', filename: 'BUvHJ4bcall.txt', name: 'BTN vs HJ 4bet Call', nameZh: 'BTN对HJ跟4bet', position: 'BTN', vsPosition: 'HJ', action: '4bet Call', category: '4b_call' },
  { id: 'BUvSB3bcall', filename: 'BUvSB3bcall.txt', name: 'BTN vs SB 3bet Call', nameZh: 'BTN对SB跟3bet', position: 'BTN', vsPosition: 'SB', action: '3bet Call', category: '4b_call' },
  { id: 'BUvSB4b', filename: 'BUvSB4b.txt', name: 'BTN vs SB 4bet', nameZh: 'BTN对SB 4bet', position: 'BTN', vsPosition: 'SB', action: '4bet', category: '4bet' },
  
  // CO vs scenarios
  { id: 'COvBB3bcall', filename: 'COvBB3bcall.txt', name: 'CO vs BB 3bet Call', nameZh: 'CO对BB跟3bet', position: 'CO', vsPosition: 'BB', action: '3bet Call', category: '4b_call' },
  { id: 'COvBU3bcall', filename: 'COvBU3bcall.txt', name: 'CO vs BTN 3bet Call', nameZh: 'CO对BTN跟3bet', position: 'CO', vsPosition: 'BTN', action: '3bet Call', category: '4b_call' },
  { id: 'COvBU4b', filename: 'COvBU4b.txt', name: 'CO vs BTN 4bet', nameZh: 'CO对BTN 4bet', position: 'CO', vsPosition: 'BTN', action: '4bet', category: '4bet' },
  { id: 'COvHJ3b', filename: 'COvHJ3b.txt', name: 'CO vs HJ 3bet', nameZh: 'CO对HJ 3bet', position: 'CO', vsPosition: 'HJ', action: '3bet', category: '3bet' },
  
  // HJ vs scenarios
  { id: 'HJvBB3bcall', filename: 'HJvBB3bcall.txt', name: 'HJ vs BB 3bet Call', nameZh: 'HJ对BB跟3bet', position: 'HJ', vsPosition: 'BB', action: '3bet Call', category: '4b_call' },
  { id: 'HJvBB4b', filename: 'HJvBB4b.txt', name: 'HJ vs BB 4bet', nameZh: 'HJ对BB 4bet', position: 'HJ', vsPosition: 'BB', action: '4bet', category: '4bet' },
  { id: 'HJvBU4b', filename: 'HJvBU4b.txt', name: 'HJ vs BTN 4bet', nameZh: 'HJ对BTN 4bet', position: 'HJ', vsPosition: 'BTN', action: '4bet', category: '4bet' },
  { id: 'HJvCO4b', filename: 'HJvCO4b.txt', name: 'HJ vs CO 4bet', nameZh: 'HJ对CO 4bet', position: 'HJ', vsPosition: 'CO', action: '4bet', category: '4bet' },
  { id: 'HJvLJ3b', filename: 'HJvLJ3b.txt', name: 'HJ vs LJ 3bet', nameZh: 'HJ对LJ 3bet', position: 'HJ', vsPosition: 'LJ', action: '3bet', category: '3bet' },
  
  // LJ vs scenarios
  { id: 'LJvBB3bcall', filename: 'LJvBB3bcall.txt', name: 'LJ vs BB 3bet Call', nameZh: 'LJ对BB跟3bet', position: 'LJ', vsPosition: 'BB', action: '3bet Call', category: '4b_call' },
  { id: 'LJvHJ3bcall', filename: 'LJvHJ3bcall.txt', name: 'LJ vs HJ 3bet Call', nameZh: 'LJ对HJ跟3bet', position: 'LJ', vsPosition: 'HJ', action: '3bet Call', category: '4b_call' },
  { id: 'LJvHJ4b', filename: 'LJvHJ4b.txt', name: 'LJ vs HJ 4bet', nameZh: 'LJ对HJ 4bet', position: 'LJ', vsPosition: 'HJ', action: '4bet', category: '4bet' },
  
  // SB vs scenarios
  { id: 'SBvBB3bcall', filename: 'SBvBB3bcall.txt', name: 'SB vs BB 3bet Call', nameZh: 'SB对BB跟3bet', position: 'SB', vsPosition: 'BB', action: '3bet Call', category: '4b_call' },
  { id: 'SBvBB4b', filename: 'SBvBB4b.txt', name: 'SB vs BB 4bet', nameZh: 'SB对BB 4bet', position: 'SB', vsPosition: 'BB', action: '4bet', category: '4bet' },
  { id: 'SBvBUcall', filename: 'SBvBUcall.txt', name: 'SB vs BTN Call', nameZh: 'SB对BTN跟注', position: 'SB', vsPosition: 'BTN', action: 'Call', category: 'call' },
  { id: 'SBvBU3bgto', filename: 'SBvBU3bgto.txt', name: 'SB vs BTN 3bet GTO', nameZh: 'SB对BTN 3bet GTO', position: 'SB', vsPosition: 'BTN', action: '3bet', category: '3bet' },
  { id: 'SBvCOflat', filename: 'SBvCOflat.txt', name: 'SB vs CO Flat', nameZh: 'SB对CO平跟', position: 'SB', vsPosition: 'CO', action: 'Flat', category: 'call' },
  { id: 'SBvCO3b', filename: 'SBvCO3b.txt', name: 'SB vs CO 3bet', nameZh: 'SB对CO 3bet', position: 'SB', vsPosition: 'CO', action: '3bet', category: '3bet' },
  
  // Heads Up scenarios
  { id: 'HU2.5', filename: 'HU2.5.txt', name: 'HU Open 2.5x', nameZh: 'HU开池2.5x', position: 'BTN', action: 'Open 2.5x', category: 'open' },
  { id: 'HU2.5call', filename: 'HU2.5call.txt', name: 'HU Call 2.5x', nameZh: 'HU跟注2.5x', position: 'BB', action: 'Call', category: 'call' },
  { id: 'HU3b200bb', filename: 'HU3b200bb.txt', name: 'HU 3bet 200bb', nameZh: 'HU 3bet 200bb', position: 'BB', action: '3bet', category: '3bet' },
  { id: 'HU3b4x', filename: 'HU3b4x.txt', name: 'HU 3bet 4x', nameZh: 'HU 3bet 4x', position: 'BB', action: '3bet 4x', category: '3bet' },
  { id: 'HU3bcall', filename: 'HU3bcall.txt', name: 'HU 3bet Call', nameZh: 'HU跟3bet', position: 'BTN', action: '3bet Call', category: '4b_call' },
  { id: 'HU4b2.5x', filename: 'HU4b2.5x.txt', name: 'HU 4bet 2.5x', nameZh: 'HU 4bet 2.5x', position: 'BTN', action: '4bet', category: '4bet' },
  { id: 'HU4bcall', filename: 'HU4bcall.txt', name: 'HU 4bet Call', nameZh: 'HU跟4bet', position: 'BB', action: '4bet Call', category: '4b_call' },
];

/**
 * All ranks in poker (high to low)
 */
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * Expand a simplified hand notation to full notation
 * e.g., "AK" -> "AKs" and "AKo", "AA" -> "AA"
 */
function expandHandNotation(hand: string): string[] {
  // Already has suit specifier
  if (hand.endsWith('s') || hand.endsWith('o')) {
    return [hand];
  }
  
  // Pocket pair
  if (hand.length === 2 && hand[0] === hand[1]) {
    return [hand];
  }
  
  // Two different ranks - expand to both suited and offsuit
  if (hand.length === 2) {
    return [`${hand}s`, `${hand}o`];
  }
  
  return [hand];
}

/**
 * Normalize hand notation (ensure higher rank comes first)
 * e.g., "KA" -> "AK", "98s" -> "98s"  
 */
function normalizeHand(hand: string): string {
  const suffix = hand.length === 3 ? hand[2] : '';
  const r1 = hand[0].toUpperCase();
  const r2 = hand[1].toUpperCase();
  
  const idx1 = RANKS.indexOf(r1);
  const idx2 = RANKS.indexOf(r2);
  
  if (idx1 < 0 || idx2 < 0) return hand;
  
  // Higher rank (lower index) comes first
  if (idx1 < idx2) {
    return `${r1}${r2}${suffix}`;
  } else if (idx1 > idx2) {
    return `${r2}${r1}${suffix}`;
  }
  return `${r1}${r2}`;
}

/**
 * Parse a range string in GTO format
 * Format: "AA,AKs,AQo:0.5,JJ:0.75,66-22"
 */
export function parseRangeString(rangeText: string): RangeWeights {
  const weights = createEmptyRange();
  
  if (!rangeText || !rangeText.trim()) {
    return weights;
  }
  
  // Split by comma and process each part
  const parts = rangeText.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Check for weight specification
    let handPart = part;
    let weight = 1.0;
    
    if (part.includes(':')) {
      const [h, w] = part.split(':');
      handPart = h.trim();
      weight = parseFloat(w.trim()) || 1.0;
    }
    
    // Check for range specification (e.g., "66-22")
    if (handPart.includes('-')) {
      const [start, end] = handPart.split('-');
      const expandedRange = expandRange(start.trim(), end.trim());
      for (const h of expandedRange) {
        const normalized = normalizeHand(h);
        if (normalized in weights) {
          weights[normalized] = weight;
        }
      }
    } else {
      // Single hand or hand+suit
      const expanded = expandHandNotation(handPart);
      for (const h of expanded) {
        const normalized = normalizeHand(h);
        if (normalized in weights) {
          weights[normalized] = weight;
        }
      }
    }
  }
  
  return weights;
}

/**
 * Expand a range like "66-22" or "ATs-A2s"
 */
function expandRange(start: string, end: string): string[] {
  const result: string[] = [];
  
  // Pocket pairs (e.g., "66-22")
  if (start.length === 2 && start[0] === start[1] && end.length === 2 && end[0] === end[1]) {
    const startIdx = RANKS.indexOf(start[0]);
    const endIdx = RANKS.indexOf(end[0]);
    if (startIdx >= 0 && endIdx >= 0) {
      for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
        result.push(`${RANKS[i]}${RANKS[i]}`);
      }
    }
    return result;
  }
  
  // Same first card range (e.g., "ATs-A2s")
  const startSuffix = start.length === 3 ? start[2] : '';
  const endSuffix = end.length === 3 ? end[2] : '';
  
  if (start[0] === end[0] && startSuffix === endSuffix) {
    const firstCard = start[0];
    const startIdx = RANKS.indexOf(start[1]);
    const endIdx = RANKS.indexOf(end[1]);
    
    if (startIdx >= 0 && endIdx >= 0) {
      for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
        if (RANKS[i] !== firstCard) {
          result.push(`${firstCard}${RANKS[i]}${startSuffix}`);
        }
      }
    }
    return result;
  }
  
  // Fallback: just return start and end
  return [start, end];
}

/**
 * Cache for loaded ranges
 */
const rangeCache = new Map<string, RangeWeights>();

/**
 * Load a preflop range from file content (for browser environment)
 */
export function loadRangeFromText(filename: string, content: string): RangeWeights {
  const cacheKey = filename;
  if (rangeCache.has(cacheKey)) {
    return rangeCache.get(cacheKey)!;
  }
  
  const range = parseRangeString(content);
  rangeCache.set(cacheKey, range);
  return range;
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): PreflopScenario | undefined {
  return PREFLOP_SCENARIOS.find(s => s.id === id);
}

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: PreflopScenario['category']): PreflopScenario[] {
  return PREFLOP_SCENARIOS.filter(s => s.category === category);
}

/**
 * Get scenarios by position
 */
export function getScenariosByPosition(position: string): PreflopScenario[] {
  return PREFLOP_SCENARIOS.filter(s => s.position === position);
}

/**
 * Convert RangeWeights to range string
 */
export function rangeToString(weights: RangeWeights): string {
  const parts: string[] = [];
  
  for (const [hand, weight] of Object.entries(weights)) {
    if (weight <= 0) continue;
    
    if (weight === 1.0) {
      parts.push(hand);
    } else {
      parts.push(`${hand}:${weight.toFixed(2)}`);
    }
  }
  
  return parts.join(',');
}

/**
 * Clear the range cache
 */
export function clearRangeCache(): void {
  rangeCache.clear();
}
