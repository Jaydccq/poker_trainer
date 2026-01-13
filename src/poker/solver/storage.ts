/**
 * LocalStorage persistence for custom solutions, ranges, and parameters
 */

import {
  SavedSolution,
  SavedRange,
  SavedParameters,
  Tag,
  RangeWeights,
  CustomSolutionConfig,
  SolverResult,
  BettingTreeConfig,
  generateId,
} from './types';

// Storage keys
const STORAGE_KEYS = {
  SOLUTIONS: 'gto_custom_solutions',
  RANGES: 'gto_saved_ranges',
  PARAMETERS: 'gto_saved_parameters',
  TAGS: 'gto_tags',
  RECENT_SOLUTIONS: 'gto_recent_solutions',
} as const;

// ============================================================================
// Tag Management
// ============================================================================

/**
 * Get all tags
 */
export function getTags(): Tag[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TAGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save tags
 */
export function saveTags(tags: Tag[]): void {
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
}

/**
 * Create a new tag
 */
export function createTag(name: string, color: string): Tag {
  const tags = getTags();
  const newTag: Tag = {
    id: generateId(),
    name,
    color,
  };
  tags.push(newTag);
  saveTags(tags);
  return newTag;
}

/**
 * Delete a tag
 */
export function deleteTag(tagId: string): void {
  const tags = getTags().filter(t => t.id !== tagId);
  saveTags(tags);
}

/**
 * Update a tag
 */
export function updateTag(tagId: string, name: string, color: string): void {
  const tags = getTags();
  const tag = tags.find(t => t.id === tagId);
  if (tag) {
    tag.name = name;
    tag.color = color;
    saveTags(tags);
  }
}

// ============================================================================
// Saved Ranges
// ============================================================================

/**
 * Get all saved ranges
 */
export function getSavedRanges(): SavedRange[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RANGES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a range
 */
export function saveRange(name: string, range: RangeWeights, tags: string[] = []): SavedRange {
  const ranges = getSavedRanges();
  const savedRange: SavedRange = {
    id: generateId(),
    name,
    range,
    tags,
    createdAt: Date.now(),
  };
  ranges.push(savedRange);
  localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(ranges));
  return savedRange;
}

/**
 * Update a saved range
 */
export function updateSavedRange(id: string, updates: Partial<Omit<SavedRange, 'id' | 'createdAt'>>): void {
  const ranges = getSavedRanges();
  const range = ranges.find(r => r.id === id);
  if (range) {
    Object.assign(range, updates);
    localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(ranges));
  }
}

/**
 * Delete a saved range
 */
export function deleteSavedRange(id: string): void {
  const ranges = getSavedRanges().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(ranges));
}

/**
 * Get ranges by tag
 */
export function getRangesByTag(tagId: string): SavedRange[] {
  return getSavedRanges().filter(r => r.tags.includes(tagId));
}

// ============================================================================
// Saved Parameters
// ============================================================================

/**
 * Get all saved parameters
 */
export function getSavedParameters(): SavedParameters[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PARAMETERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save parameters
 */
export function saveParameters(
  name: string,
  stackSize: number,
  potSize: number,
  bettingTree: BettingTreeConfig,
  tags: string[] = []
): SavedParameters {
  const params = getSavedParameters();
  const savedParams: SavedParameters = {
    id: generateId(),
    name,
    stackSize,
    potSize,
    bettingTree,
    tags,
    createdAt: Date.now(),
  };
  params.push(savedParams);
  localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(params));
  return savedParams;
}

/**
 * Update saved parameters
 */
export function updateSavedParameters(
  id: string,
  updates: Partial<Omit<SavedParameters, 'id' | 'createdAt'>>
): void {
  const params = getSavedParameters();
  const param = params.find(p => p.id === id);
  if (param) {
    Object.assign(param, updates);
    localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(params));
  }
}

/**
 * Delete saved parameters
 */
export function deleteSavedParameters(id: string): void {
  const params = getSavedParameters().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(params));
}

// ============================================================================
// Custom Solutions
// ============================================================================

/**
 * Get all saved solutions
 */
export function getSavedSolutions(): SavedSolution[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SOLUTIONS);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Convert strategies Map if needed
    return parsed.map((sol: SavedSolution) => {
      if (sol.result?.strategies && !(sol.result.strategies instanceof Map)) {
        sol.result.strategies = new Map(Object.entries(sol.result.strategies));
      }
      return sol;
    });
  } catch {
    return [];
  }
}

/**
 * Save a solution
 */
export function saveSolution(
  name: string,
  config: CustomSolutionConfig,
  result?: SolverResult,
  tags: string[] = []
): SavedSolution {
  const solutions = getSavedSolutions();
  const now = Date.now();
  
  // Convert Map to object for serialization
  let serializableResult = result;
  if (result?.strategies instanceof Map) {
    serializableResult = {
      ...result,
      strategies: Object.fromEntries(result.strategies),
    } as unknown as SolverResult;
  }
  
  const savedSolution: SavedSolution = {
    id: generateId(),
    name,
    config,
    result: serializableResult,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  
  solutions.push(savedSolution);
  localStorage.setItem(STORAGE_KEYS.SOLUTIONS, JSON.stringify(solutions));
  
  // Add to recent solutions
  addToRecentSolutions(savedSolution.id);
  
  return savedSolution;
}

/**
 * Update a saved solution
 */
export function updateSavedSolution(
  id: string,
  updates: Partial<Omit<SavedSolution, 'id' | 'createdAt'>>
): void {
  const solutions = getSavedSolutions();
  const solution = solutions.find(s => s.id === id);
  if (solution) {
    Object.assign(solution, updates, { updatedAt: Date.now() });
    
    // Convert Map if present in result
    if (solution.result?.strategies instanceof Map) {
      solution.result = {
        ...solution.result,
        strategies: Object.fromEntries(solution.result.strategies),
      } as unknown as SolverResult;
    }
    
    localStorage.setItem(STORAGE_KEYS.SOLUTIONS, JSON.stringify(solutions));
  }
}

/**
 * Delete a saved solution
 */
export function deleteSavedSolution(id: string): void {
  const solutions = getSavedSolutions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SOLUTIONS, JSON.stringify(solutions));
  
  // Remove from recent solutions
  removeFromRecentSolutions(id);
}

/**
 * Get a single solution by ID
 */
export function getSolutionById(id: string): SavedSolution | undefined {
  return getSavedSolutions().find(s => s.id === id);
}

// ============================================================================
// Recent Solutions
// ============================================================================

/**
 * Get recent solution IDs
 */
export function getRecentSolutionIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_SOLUTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get recent solutions
 */
export function getRecentSolutions(): SavedSolution[] {
  const ids = getRecentSolutionIds();
  const solutions = getSavedSolutions();
  return ids
    .map(id => solutions.find(s => s.id === id))
    .filter((s): s is SavedSolution => s !== undefined);
}

/**
 * Add solution to recent list
 */
function addToRecentSolutions(id: string): void {
  const recent = getRecentSolutionIds();
  const filtered = recent.filter(rid => rid !== id);
  filtered.unshift(id);
  // Keep only last 10
  localStorage.setItem(
    STORAGE_KEYS.RECENT_SOLUTIONS,
    JSON.stringify(filtered.slice(0, 10))
  );
}

/**
 * Remove solution from recent list
 */
function removeFromRecentSolutions(id: string): void {
  const recent = getRecentSolutionIds().filter(rid => rid !== id);
  localStorage.setItem(STORAGE_KEYS.RECENT_SOLUTIONS, JSON.stringify(recent));
}

// ============================================================================
// Filter Utilities
// ============================================================================

/**
 * Filter items by tags
 */
export function filterByTags<T extends { tags: string[] }>(
  items: T[],
  tagIds: string[],
  matchAll: boolean = false
): T[] {
  if (tagIds.length === 0) return items;
  
  return items.filter(item => {
    if (matchAll) {
      return tagIds.every(tid => item.tags.includes(tid));
    }
    return tagIds.some(tid => item.tags.includes(tid));
  });
}

// ============================================================================
// Import/Export
// ============================================================================

/**
 * Export range to Pio/GTO+ format string
 */
export function exportRangeToString(range: RangeWeights): string {
  const parts: string[] = [];
  
  for (const [hand, weight] of Object.entries(range)) {
    if (weight === 0) continue;
    if (weight === 1) {
      parts.push(hand);
    } else {
      parts.push(`${hand}:${weight.toFixed(2)}`);
    }
  }
  
  return parts.join(',');
}

/**
 * Import range from Pio/GTO+ format string
 */
export function importRangeFromString(rangeStr: string): RangeWeights {
  const weights: RangeWeights = {};
  
  // Initialize all hands to 0
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      if (i === j) {
        weights[`${ranks[i]}${ranks[i]}`] = 0;
      } else if (i < j) {
        weights[`${ranks[i]}${ranks[j]}s`] = 0;
      } else {
        weights[`${ranks[j]}${ranks[i]}o`] = 0;
      }
    }
  }
  
  // Parse range string
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    if (part.includes(':')) {
      const [hand, weightStr] = part.split(':');
      const normalizedHand = normalizeHandNotation(hand);
      if (normalizedHand && normalizedHand in weights) {
        weights[normalizedHand] = parseFloat(weightStr) || 0;
      }
    } else {
      const normalizedHand = normalizeHandNotation(part);
      if (normalizedHand && normalizedHand in weights) {
        weights[normalizedHand] = 1;
      }
    }
  }
  
  return weights;
}

/**
 * Normalize hand notation (e.g., "aKs" -> "AKs")
 */
function normalizeHandNotation(hand: string): string | null {
  if (hand.length < 2 || hand.length > 3) return null;
  
  const r1 = hand[0].toUpperCase();
  const r2 = hand[1].toUpperCase();
  const suffix = hand.length === 3 ? hand[2].toLowerCase() : '';
  
  const ranks = 'AKQJT98765432';
  if (!ranks.includes(r1) || !ranks.includes(r2)) return null;
  
  if (r1 === r2) {
    return `${r1}${r2}`;
  }
  
  // Ensure higher rank comes first
  const idx1 = ranks.indexOf(r1);
  const idx2 = ranks.indexOf(r2);
  
  if (idx1 < idx2) {
    return `${r1}${r2}${suffix || 's'}`;
  } else {
    return `${r2}${r1}${suffix || 'o'}`;
  }
}

/**
 * Export all data for backup
 */
export function exportAllData(): string {
  const data = {
    solutions: getSavedSolutions(),
    ranges: getSavedRanges(),
    parameters: getSavedParameters(),
    tags: getTags(),
    exportedAt: Date.now(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from backup
 */
export function importAllData(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    
    if (data.solutions) {
      localStorage.setItem(STORAGE_KEYS.SOLUTIONS, JSON.stringify(data.solutions));
    }
    if (data.ranges) {
      localStorage.setItem(STORAGE_KEYS.RANGES, JSON.stringify(data.ranges));
    }
    if (data.parameters) {
      localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(data.parameters));
    }
    if (data.tags) {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(data.tags));
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
