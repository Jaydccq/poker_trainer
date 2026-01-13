/**
 * Training mode hook for Chinese Poker
 * Manages training game state with opponent comparison
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/poker/solver/cards';
import { Arrangement } from '@/types/chinese-poker';
import { ScoringRule, scoreMatchup, ScoringResult } from '@/utils/chinese-poker/scoring/basic-scoring';
import { dealChinesePoker } from '@/utils/chinese-poker/deck';
import { isFoul } from '@/utils/chinese-poker/validation';
import { 
  analyzePlayerChoiceWithPreCalc, 
  preCalculateOptimal,
  AnalysisResult,
  PreCalculationResult
} from '@/utils/chinese-poker/solver/analyzer';
import { OptimalArrangementResult, getHandTypes, HandTypeInfo } from '@/utils/chinese-poker/solver/ev-calculator';
import { getAllSpecialHands } from '@/utils/chinese-poker/special-hands';

export type TrainingPhase = 'dealing' | 'arranging' | 'analyzing' | 'review';

/**
 * Opponent info with optimal arrangement
 */
export interface OpponentResult {
  cards: Card[];
  optimalArrangement: Arrangement;
  handTypes: HandTypeInfo;
  scoreVsPlayer: ScoringResult;  // From player's perspective
}

export interface TrainingState {
  phase: TrainingPhase;
  cards: Card[];
  opponentCards: Card[][];  // Cards for each opponent
  playerArrangement: Arrangement | null;
  analysis: AnalysisResult | null;
  scoringRule: ScoringRule;
  numOpponents: number;
  error: string | null;
  // Pre-calculation state
  isCalculatingOptimal: boolean;
  optimalReady: boolean;
  preCalcResult: PreCalculationResult | null;
  // Opponent results
  opponentResults: OpponentResult[];
  totalScore: number;  // Player's total score vs all opponents
}

export interface UseChinesePokerTrainingReturn {
  state: TrainingState;
  dealNewHand: () => void;
  submitArrangement: (arrangement: Arrangement) => void;
  resetToDealing: () => void;
  setScoringRule: (rule: ScoringRule) => void;
  setNumOpponents: (num: number) => void;
  // Convenience getters
  optimalArrangement: OptimalArrangementResult | null;
}

/**
 * Training mode hook with pre-calculation and opponent comparison
 */
export function useChinesePokerTraining(): UseChinesePokerTrainingReturn {
  const [state, setState] = useState<TrainingState>({
    phase: 'dealing',
    cards: [],
    opponentCards: [],
    playerArrangement: null,
    analysis: null,
    scoringRule: ScoringRule.ONE_ONE_ONE,
    numOpponents: 1,
    error: null,
    isCalculatingOptimal: false,
    optimalReady: false,
    preCalcResult: null,
    opponentResults: [],
    totalScore: 0
  });

  // Ref to track if we've started calculating for current cards
  const calculatingFor = useRef<string>('');

  // Pre-calculate optimal arrangement when cards are dealt
  useEffect(() => {
    if (state.cards.length === 13 && !state.optimalReady && !state.isCalculatingOptimal) {
      // Create a unique key for these cards
      const cardsKey = state.cards.map(c => `${c.rank}${c.suit}`).sort().join('');
      
      if (calculatingFor.current !== cardsKey) {
        calculatingFor.current = cardsKey;
        
        setState(prev => ({ ...prev, isCalculatingOptimal: true }));

        // Start background calculation
        setTimeout(() => {
          try {
            const result = preCalculateOptimal(state.cards, {
              iterations: 500,
              numOpponents: state.numOpponents,
              scoringRule: state.scoringRule,
              maxArrangements: 100,
              seed: Date.now()
            });

            setState(prev => ({
              ...prev,
              isCalculatingOptimal: false,
              optimalReady: true,
              preCalcResult: result
            }));
          } catch (error) {
            console.error('Pre-calculation failed:', error);
            setState(prev => ({
              ...prev,
              isCalculatingOptimal: false
            }));
          }
        }, 50);
      }
    }
  }, [state.cards, state.optimalReady, state.isCalculatingOptimal, state.numOpponents, state.scoringRule]);

  const dealNewHand = useCallback(() => {
    const hands = dealChinesePoker(state.numOpponents + 1);
    calculatingFor.current = '';  // Reset calculation tracker
    
    // Extract opponent cards
    const opponentCards = hands.slice(1).map(h => h.cards);
    
    setState(prev => ({
      ...prev,
      phase: 'arranging',
      cards: hands[0].cards,
      opponentCards,
      playerArrangement: null,
      analysis: null,
      error: null,
      isCalculatingOptimal: false,
      optimalReady: false,
      preCalcResult: null,
      opponentResults: [],
      totalScore: 0
    }));
  }, [state.numOpponents]);

  const submitArrangement = useCallback((arrangement: Arrangement) => {
    // Validate arrangement (check for foul)
    if (isFoul(arrangement)) {
      setState(prev => ({
        ...prev,
        error: 'Invalid arrangement: Back hand must be stronger than Middle, and Middle stronger than Front'
      }));
      return;
    }

    setState(prev => ({ ...prev, phase: 'analyzing', error: null }));

    // Run analysis
    setTimeout(() => {
      try {
        // Get or calculate player's optimal
        const preCalc = state.preCalcResult || preCalculateOptimal(state.cards, {
          iterations: 500,
          numOpponents: state.numOpponents,
          scoringRule: state.scoringRule,
          maxArrangements: 100,
          seed: Date.now()
        });

        // Analyze player's choice
        const analysis = analyzePlayerChoiceWithPreCalc(
          state.cards,
          arrangement,
          preCalc,
          {
            iterations: 500,
            numOpponents: state.numOpponents,
            scoringRule: state.scoringRule,
            seed: Date.now()
          }
        );

        // Calculate optimal for each opponent and score vs player
        const opponentResults: OpponentResult[] = [];
        let totalScore = 0;

        // Get player's special hand
        const playerSpecial = getAllSpecialHands(state.cards, arrangement);
        const playerSpecialHand = playerSpecial.isValid 
          ? { type: playerSpecial.type!, points: playerSpecial.points }
          : undefined;

        for (const oppCards of state.opponentCards) {
          // Find optimal arrangement for opponent
          const oppOptimal = preCalculateOptimal(oppCards, {
            iterations: 200,  // Fewer iterations for opponents (speed)
            numOpponents: 1,
            scoringRule: state.scoringRule,
            maxArrangements: 50,
            seed: Date.now()
          });

          const oppArrangement = oppOptimal.optimalResult.optimalArrangement;
          const oppHandTypes = getHandTypes(oppArrangement);

          // Get opponent's special hand
          const oppSpecial = getAllSpecialHands(oppCards, oppArrangement);
          const oppSpecialHand = oppSpecial.isValid
            ? { type: oppSpecial.type!, points: oppSpecial.points }
            : undefined;

          // Score player vs opponent
          const scoreResult = scoreMatchup(
            arrangement,
            oppArrangement,
            state.scoringRule,
            playerSpecialHand,
            oppSpecialHand
          );

          totalScore += scoreResult.totalPoints;

          opponentResults.push({
            cards: oppCards,
            optimalArrangement: oppArrangement,
            handTypes: oppHandTypes,
            scoreVsPlayer: scoreResult
          });
        }

        setState(prev => ({
          ...prev,
          phase: 'review',
          playerArrangement: arrangement,
          analysis,
          preCalcResult: preCalc,
          optimalReady: true,
          opponentResults,
          totalScore
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          phase: 'arranging',
          error: error instanceof Error ? error.message : 'Analysis failed'
        }));
      }
    }, 50);
  }, [state.cards, state.opponentCards, state.numOpponents, state.scoringRule, state.preCalcResult]);

  const resetToDealing = useCallback(() => {
    calculatingFor.current = '';
    setState({
      phase: 'dealing',
      cards: [],
      opponentCards: [],
      playerArrangement: null,
      analysis: null,
      scoringRule: state.scoringRule,
      numOpponents: state.numOpponents,
      error: null,
      isCalculatingOptimal: false,
      optimalReady: false,
      preCalcResult: null,
      opponentResults: [],
      totalScore: 0
    });
  }, [state.scoringRule, state.numOpponents]);

  const setScoringRule = useCallback((rule: ScoringRule) => {
    calculatingFor.current = '';
    setState(prev => ({ 
      ...prev, 
      scoringRule: rule,
      optimalReady: false,
      preCalcResult: null
    }));
  }, []);

  const setNumOpponents = useCallback((num: number) => {
    if (num < 1 || num > 3) {
      throw new Error('Number of opponents must be 1-3');
    }
    calculatingFor.current = '';
    setState(prev => ({ 
      ...prev, 
      numOpponents: num,
      optimalReady: false,
      preCalcResult: null
    }));
  }, []);

  return {
    state,
    dealNewHand,
    submitArrangement,
    resetToDealing,
    setScoringRule,
    setNumOpponents,
    optimalArrangement: state.preCalcResult?.optimalResult || null
  };
}
