/**
 * Basic scoring system for Chinese Poker
 * Supports three scoring variants: 1-1-1, 2-4, and 1-6
 */

import { Arrangement } from '@/types/chinese-poker';
import { compareFrontHands, compareFiveCardHands_Direct } from '../comparison';
import { SpecialHandType } from '../special-hands';

/**
 * Scoring rule variants
 */
export enum ScoringRule {
  ONE_ONE_ONE = '1-1-1',     // Basic: 1 point per row
  TWO_FOUR = '2-4',          // American/HK: 2-4 points per row
  ONE_SIX = '1-6'            // With Grand Slam: 1-6 points per row
}

/**
 * Row comparison result
 */
export interface RowResult {
  winner: 'player1' | 'player2' | 'tie';
  points: number;
}

/**
 * Complete scoring result for a matchup
 */
export interface ScoringResult {
  front: RowResult;
  middle: RowResult;
  back: RowResult;
  scoop: boolean;
  totalPoints: number;
  specialHandBonus: number;
}

/**
 * Compare front rows (3-card hands)
 */
function compareFrontRow(
  player1Front: Arrangement['front'],
  player2Front: Arrangement['front']
): 'player1' | 'player2' | 'tie' {
  const comparison = compareFrontHands(player1Front, player2Front);

  if (comparison > 0) return 'player1';
  if (comparison < 0) return 'player2';
  return 'tie';
}

/**
 * Compare middle or back rows (5-card hands)
 */
function compare5CardRow(
  player1Row: Arrangement['middle'] | Arrangement['back'],
  player2Row: Arrangement['middle'] | Arrangement['back']
): 'player1' | 'player2' | 'tie' {
  const comparison = compareFiveCardHands_Direct(player1Row, player2Row);

  if (comparison > 0) return 'player1';
  if (comparison < 0) return 'player2';
  return 'tie';
}

/**
 * Calculate points for a row based on scoring rule
 */
function getRowPoints(
  row: 'front' | 'middle' | 'back',
  rule: ScoringRule
): number {
  switch (rule) {
    case ScoringRule.ONE_ONE_ONE:
      return 1;

    case ScoringRule.TWO_FOUR:
      if (row === 'front') return 2;
      if (row === 'middle') return 2;
      return 4;

    case ScoringRule.ONE_SIX:
      if (row === 'front') return 1;
      if (row === 'middle') return 2;
      return 6;
  }
}

/**
 * Calculate scoop bonus based on scoring rule
 */
function getScoopBonus(rule: ScoringRule): number {
  switch (rule) {
    case ScoringRule.ONE_ONE_ONE:
      return 3; // Total 6 points (3 + 3 bonus)

    case ScoringRule.TWO_FOUR:
      return 4; // Total 12 points (8 + 4 bonus)

    case ScoringRule.ONE_SIX:
      return 9; // Total 18 points (9 + 9 bonus = Grand Slam)
  }
}

/**
 * Score a matchup between two players
 * Returns points from player1's perspective (positive = player1 wins, negative = player2 wins)
 */
export function scoreMatchup(
  player1: Arrangement,
  player2: Arrangement,
  rule: ScoringRule = ScoringRule.ONE_ONE_ONE,
  player1SpecialHand?: { type: SpecialHandType; points: number },
  player2SpecialHand?: { type: SpecialHandType; points: number }
): ScoringResult {
  // Compare each row
  const frontWinner = compareFrontRow(player1.front, player2.front);
  const middleWinner = compare5CardRow(player1.middle, player2.middle);
  const backWinner = compare5CardRow(player1.back, player2.back);

  // Get points for each row
  const frontPoints = getRowPoints('front', rule);
  const middlePoints = getRowPoints('middle', rule);
  const backPoints = getRowPoints('back', rule);

  // Calculate row results
  const front: RowResult = {
    winner: frontWinner,
    points: frontWinner === 'tie' ? 0 : frontPoints
  };

  const middle: RowResult = {
    winner: middleWinner,
    points: middleWinner === 'tie' ? 0 : middlePoints
  };

  const back: RowResult = {
    winner: backWinner,
    points: backWinner === 'tie' ? 0 : backPoints
  };

  // Check for scoop (winning all three rows)
  const player1Wins = [frontWinner, middleWinner, backWinner].filter(w => w === 'player1').length;
  const player2Wins = [frontWinner, middleWinner, backWinner].filter(w => w === 'player2').length;

  const scoop = player1Wins === 3 || player2Wins === 3;

  // Calculate base points
  let totalPoints = 0;

  if (frontWinner === 'player1') totalPoints += frontPoints;
  else if (frontWinner === 'player2') totalPoints -= frontPoints;

  if (middleWinner === 'player1') totalPoints += middlePoints;
  else if (middleWinner === 'player2') totalPoints -= middlePoints;

  if (backWinner === 'player1') totalPoints += backPoints;
  else if (backWinner === 'player2') totalPoints -= backPoints;

  // Add scoop bonus
  if (scoop) {
    const scoopBonus = getScoopBonus(rule);
    if (player1Wins === 3) {
      totalPoints += scoopBonus;
    } else {
      totalPoints -= scoopBonus;
    }
  }

  // Add special hand bonuses
  let specialHandBonus = 0;
  if (player1SpecialHand) {
    specialHandBonus += player1SpecialHand.points;
  }
  if (player2SpecialHand) {
    specialHandBonus -= player2SpecialHand.points;
  }

  totalPoints += specialHandBonus;

  return {
    front,
    middle,
    back,
    scoop,
    totalPoints,
    specialHandBonus
  };
}

/**
 * Score a multiplayer game (3-4 players)
 * Each player is compared against every other player
 * Returns net points for each player
 */
export function scoreMultiplayer(
  arrangements: Map<string, Arrangement>,
  rule: ScoringRule = ScoringRule.ONE_ONE_ONE,
  specialHands?: Map<string, { type: SpecialHandType; points: number }>
): Map<string, number> {
  const playerIds = Array.from(arrangements.keys());
  const scores = new Map<string, number>();

  // Initialize all scores to 0
  for (const playerId of playerIds) {
    scores.set(playerId, 0);
  }

  // Compare each pair of players
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const player1Id = playerIds[i];
      const player2Id = playerIds[j];

      const player1Arrangement = arrangements.get(player1Id)!;
      const player2Arrangement = arrangements.get(player2Id)!;

      const player1Special = specialHands?.get(player1Id);
      const player2Special = specialHands?.get(player2Id);

      const result = scoreMatchup(
        player1Arrangement,
        player2Arrangement,
        rule,
        player1Special,
        player2Special
      );

      // Update scores
      scores.set(player1Id, scores.get(player1Id)! + result.totalPoints);
      scores.set(player2Id, scores.get(player2Id)! - result.totalPoints);
    }
  }

  return scores;
}

/**
 * Handle foul penalties
 * A fouled hand automatically loses to all valid hands
 */
export function scoreFouledHand(
  rule: ScoringRule = ScoringRule.ONE_ONE_ONE
): number {
  // Foul penalty = lose all rows + scoop penalty
  const frontPoints = getRowPoints('front', rule);
  const middlePoints = getRowPoints('middle', rule);
  const backPoints = getRowPoints('back', rule);
  const scoopBonus = getScoopBonus(rule);

  return -(frontPoints + middlePoints + backPoints + scoopBonus);
}
