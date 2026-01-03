'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { HandNotation, Position, ActionFrequencies } from '@/poker/types';
import { getHandMatrix, getCombos, POSITION_NAMES } from '@/poker/constants';
import { SCENARIOS, getHandStrategy, getDefaultFrequencies } from '@/poker/data/strategies';

interface TrainingState {
  currentHand: HandNotation | null;
  scenarioId: string;
  handsPlayed: number;
  correctCount: number;
  totalScore: number;
  showFeedback: boolean;
  lastAction: 'fold' | 'call' | 'raise' | null;
  lastResult: {
    isCorrect: boolean;
    score: number;
    gtoFreqs: ActionFrequencies;
    optimalAction: string;
  } | null;
}

// Get a random hand weighted by playability
function getRandomHand(scenarioId: string): HandNotation {
  const matrix = getHandMatrix();
  const hands: HandNotation[] = [];
  
  // Collect all hands
  for (const row of matrix) {
    for (const cell of row) {
      hands.push(cell.notation);
    }
  }
  
  // Return random hand
  return hands[Math.floor(Math.random() * hands.length)];
}

// Calculate score based on action vs GTO
function calculateScore(
  userAction: 'fold' | 'call' | 'raise',
  gtoFreqs: ActionFrequencies
): { score: number; isCorrect: boolean; optimalAction: string } {
  const userFreq = gtoFreqs[userAction];
  
  // Determine optimal action
  let optimalAction = 'fold';
  let maxFreq = gtoFreqs.fold;
  if (gtoFreqs.call > maxFreq) {
    maxFreq = gtoFreqs.call;
    optimalAction = 'call';
  }
  if (gtoFreqs.raise > maxFreq) {
    maxFreq = gtoFreqs.raise;
    optimalAction = 'raise';
  }
  
  // Score: base score from action frequency + bonus for correct primary action
  const baseScore = userFreq * 100;
  const isOptimal = userAction === optimalAction;
  const score = Math.round(baseScore + (isOptimal ? 0 : 0));
  
  return {
    score: Math.min(100, score),
    isCorrect: userFreq >= 0.5 || isOptimal,
    optimalAction,
  };
}

export default function TrainingPage() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState>({
    currentHand: null,
    scenarioId: 'btn_rfi',
    handsPlayed: 0,
    correctCount: 0,
    totalScore: 0,
    showFeedback: false,
    lastAction: null,
    lastResult: null,
  });
  
  const scenario = SCENARIOS.find(s => s.id === state.scenarioId);
  
  // Deal new hand
  const dealNewHand = useCallback(() => {
    const newHand = getRandomHand(state.scenarioId);
    setState(prev => ({
      ...prev,
      currentHand: newHand,
      showFeedback: false,
      lastAction: null,
      lastResult: null,
    }));
  }, [state.scenarioId]);
  
  // Start with a hand
  useEffect(() => {
    if (!state.currentHand) {
      dealNewHand();
    }
  }, [state.currentHand, dealNewHand]);
  
  // Handle user action
  const handleAction = useCallback((action: 'fold' | 'call' | 'raise') => {
    if (!state.currentHand || state.showFeedback) return;
    
    const gtoFreqs = getHandStrategy(state.scenarioId, state.currentHand);
    const result = calculateScore(action, gtoFreqs);
    
    setState(prev => ({
      ...prev,
      showFeedback: true,
      lastAction: action,
      lastResult: {
        ...result,
        gtoFreqs,
      },
      handsPlayed: prev.handsPlayed + 1,
      correctCount: prev.correctCount + (result.isCorrect ? 1 : 0),
      totalScore: prev.totalScore + result.score,
    }));
  }, [state.currentHand, state.scenarioId, state.showFeedback]);
  
  // Change scenario
  const changeScenario = useCallback((newScenarioId: string) => {
    setState(prev => ({
      ...prev,
      scenarioId: newScenarioId,
      currentHand: null,
      showFeedback: false,
    }));
  }, []);
  
  // Get hand display
  const getHandDisplay = (notation: HandNotation): { cards: string; type: string } => {
    const clean = notation.replace(/[so]$/, '');
    const r1 = clean[0];
    const r2 = clean[1];
    
    if (r1 === r2) {
      return { cards: `${r1}♠ ${r1}♥`, type: 'Pocket Pair' };
    }
    if (notation.endsWith('s')) {
      return { cards: `${r1}♠ ${r2}♠`, type: 'Suited' };
    }
    return { cards: `${r1}♠ ${r2}♥`, type: 'Offsuit' };
  };
  
  const handDisplay = state.currentHand ? getHandDisplay(state.currentHand) : null;
  const averageScore = state.handsPlayed > 0 
    ? Math.round(state.totalScore / state.handsPlayed) 
    : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← Back
        </button>
        <h1>Preflop Training</h1>
      </header>
      
      {/* Scenario selector */}
      <div className={styles.scenarioBar}>
        <select 
          value={state.scenarioId}
          onChange={(e) => changeScenario(e.target.value)}
          className={styles.scenarioSelect}
        >
          {SCENARIOS.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.nameZh})</option>
          ))}
        </select>
        
        {scenario && (
          <div className={styles.positionBadge}>
            <span className={styles.positionIcon}>📍</span>
            {scenario.position}
            {scenario.vsPosition && ` vs ${scenario.vsPosition}`}
          </div>
        )}
      </div>
      
      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Hands</span>
          <span className={styles.statValue}>{state.handsPlayed}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Correct</span>
          <span className={styles.statValue}>{state.correctCount}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Accuracy</span>
          <span className={styles.statValue}>
            {state.handsPlayed > 0 
              ? Math.round((state.correctCount / state.handsPlayed) * 100) 
              : 0}%
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Avg Score</span>
          <span className={styles.statValue}>{averageScore}</span>
        </div>
      </div>
      
      {/* Table area */}
      <div className={styles.tableArea}>
        <div className={styles.pokerTable}>
          {/* Position indicator */}
          <div className={styles.positionDisplay}>
            {scenario && (
              <>
                <div className={styles.positionLabel}>
                  {POSITION_NAMES[scenario.position].en}
                </div>
                <div className={styles.positionLabelZh}>
                  {POSITION_NAMES[scenario.position].zh}
                </div>
              </>
            )}
          </div>
          
          {/* Hero hand */}
          {handDisplay && (
            <div className={styles.heroHand}>
              <div className={styles.handCards}>{handDisplay.cards}</div>
              <div className={styles.handNotation}>
                {state.currentHand}
                <span className={styles.handType}>{handDisplay.type}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Feedback panel */}
      {state.showFeedback && state.lastResult && (
        <div className={`${styles.feedback} ${state.lastResult.isCorrect ? styles.correct : styles.incorrect}`}>
          <div className={styles.feedbackHeader}>
            {state.lastResult.isCorrect ? '✅ Good!' : '❌ Suboptimal'}
            <span className={styles.feedbackScore}>Score: {state.lastResult.score}</span>
          </div>
          
          <div className={styles.gtoBreakdown}>
            <div className={styles.gtoRow}>
              <span className={styles.actionLabel}>Raise</span>
              <div className={styles.freqBar}>
                <div 
                  className={styles.freqFill}
                  style={{ 
                    width: `${state.lastResult.gtoFreqs.raise * 100}%`,
                    backgroundColor: '#22c55e'
                  }}
                />
              </div>
              <span className={styles.freqPct}>
                {(state.lastResult.gtoFreqs.raise * 100).toFixed(0)}%
              </span>
              {state.lastAction === 'raise' && <span className={styles.yourChoice}>← You</span>}
            </div>
            <div className={styles.gtoRow}>
              <span className={styles.actionLabel}>Call</span>
              <div className={styles.freqBar}>
                <div 
                  className={styles.freqFill}
                  style={{ 
                    width: `${state.lastResult.gtoFreqs.call * 100}%`,
                    backgroundColor: '#eab308'
                  }}
                />
              </div>
              <span className={styles.freqPct}>
                {(state.lastResult.gtoFreqs.call * 100).toFixed(0)}%
              </span>
              {state.lastAction === 'call' && <span className={styles.yourChoice}>← You</span>}
            </div>
            <div className={styles.gtoRow}>
              <span className={styles.actionLabel}>Fold</span>
              <div className={styles.freqBar}>
                <div 
                  className={styles.freqFill}
                  style={{ 
                    width: `${state.lastResult.gtoFreqs.fold * 100}%`,
                    backgroundColor: '#6b7280'
                  }}
                />
              </div>
              <span className={styles.freqPct}>
                {(state.lastResult.gtoFreqs.fold * 100).toFixed(0)}%
              </span>
              {state.lastAction === 'fold' && <span className={styles.yourChoice}>← You</span>}
            </div>
          </div>
          
          {!state.lastResult.isCorrect && (
            <div className={styles.suggestion}>
              Optimal: <strong>{state.lastResult.optimalAction.toUpperCase()}</strong>
            </div>
          )}
        </div>
      )}
      
      {/* Action buttons */}
      <div className={styles.actionBar}>
        {!state.showFeedback ? (
          <>
            <button 
              className={`${styles.actionBtn} ${styles.foldBtn}`}
              onClick={() => handleAction('fold')}
            >
              Fold
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.callBtn}`}
              onClick={() => handleAction('call')}
            >
              Call
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.raiseBtn}`}
              onClick={() => handleAction('raise')}
            >
              Raise
            </button>
          </>
        ) : (
          <button 
            className={`${styles.actionBtn} ${styles.nextBtn}`}
            onClick={dealNewHand}
          >
            Next Hand →
          </button>
        )}
      </div>
    </div>
  );
}
