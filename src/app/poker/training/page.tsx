'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp } from 'lucide-react';
import { HandNotation, ActionFrequencies } from '@/poker/types';
import { getHandMatrix, POSITION_NAMES } from '@/poker/constants';
import { SCENARIOS, getHandStrategy, getDefaultFrequencies } from '@/poker/data/strategies';
import { Button } from '@/components/ui';

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

function getRandomHand(scenarioId: string): HandNotation {
  const matrix = getHandMatrix();
  const hands: HandNotation[] = [];

  for (const row of matrix) {
    for (const cell of row) {
      hands.push(cell.notation);
    }
  }

  return hands[Math.floor(Math.random() * hands.length)];
}

function calculateScore(
  userAction: 'fold' | 'call' | 'raise',
  gtoFreqs: ActionFrequencies
): { score: number; isCorrect: boolean; optimalAction: string } {
  const userFreq = gtoFreqs[userAction];

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
    currentHand: getRandomHand('btn_rfi'),
    scenarioId: 'btn_rfi',
    handsPlayed: 0,
    correctCount: 0,
    totalScore: 0,
    showFeedback: false,
    lastAction: null,
    lastResult: null,
  });

  const scenario = SCENARIOS.find(s => s.id === state.scenarioId);

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

  const handleAction = useCallback((action: 'fold' | 'call' | 'raise') => {
    if (!state.currentHand || state.showFeedback) return;

    const strategy = getHandStrategy(state.scenarioId, state.currentHand);
    const gtoFreqs = strategy || getDefaultFrequencies();
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

  const accuracy = state.handsPlayed > 0 ? Math.round((state.correctCount / state.handsPlayed) * 100) : 0;
  const avgScore = state.handsPlayed > 0 ? Math.round(state.totalScore / state.handsPlayed) : 0;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-5 px-5 py-4 bg-black/20">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push('/')}
        >
          Back
        </Button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Preflop Training
        </h1>
      </header>

      {/* Scenario Selection Bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-white/5 flex-wrap">
        <select
          className="flex-1 min-w-[200px] bg-white/10 border border-white/20 text-white px-3.5 py-2.5 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          value={state.scenarioId}
          onChange={(e) => {
            setState(prev => ({
              ...prev,
              scenarioId: e.target.value,
              currentHand: getRandomHand(e.target.value),
              showFeedback: false,
            }));
          }}
        >
          {SCENARIOS.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {scenario && (
          <div className="flex items-center gap-2 bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] px-3.5 py-2 rounded-full font-semibold text-sm">
            <Target className="w-4 h-4" />
            <span>{POSITION_NAMES[scenario.position].en}</span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex gap-1 px-5 py-3 bg-black/20">
        <div className="flex-1 text-center p-2 bg-white/5 rounded-lg">
          <span className="block text-[10px] text-white/50 uppercase mb-1">Hands</span>
          <span className="text-xl font-bold">{state.handsPlayed}</span>
        </div>
        <div className="flex-1 text-center p-2 bg-white/5 rounded-lg">
          <span className="block text-[10px] text-white/50 uppercase mb-1">Accuracy</span>
          <span className="text-xl font-bold text-[#22c55e]">{accuracy}%</span>
        </div>
        <div className="flex-1 text-center p-2 bg-white/5 rounded-lg">
          <span className="block text-[10px] text-white/50 uppercase mb-1">Avg Score</span>
          <span className="text-xl font-bold text-[#7C3AED]">{avgScore}</span>
        </div>
      </div>

      {/* Poker Table Area */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div
          className="w-full max-w-[400px] aspect-[1.5] rounded-[120px] border-[12px] border-[#78350f] shadow-2xl flex flex-col items-center justify-center gap-4 relative"
          style={{
            background: 'linear-gradient(135deg, #065f46, #047857, #059669)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Position Display */}
          {scenario && (
            <div className="text-center">
              <div className="text-sm text-white/70">{scenario.action}</div>
            </div>
          )}

          {/* Hand Display */}
          {state.currentHand && (
            <div className="text-center">
              <div className="text-[2.5rem] tracking-[8px] mb-2" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
                {state.currentHand}
              </div>
              <div className="text-2xl font-bold text-[#ffd700] flex items-center justify-center gap-2">
                <span>{state.currentHand}</span>
                <span className="text-xs font-normal text-white/60 bg-black/30 px-2 py-1 rounded">
                  {state.currentHand.includes('s') ? 'Suited' : state.currentHand.includes('o') ? 'Offsuit' : 'Pair'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {state.showFeedback && state.lastResult && (
        <div className={`mx-5 p-4 rounded-xl animate-slideIn ${
          state.lastResult.isCorrect
            ? 'bg-[#22c55e]/15 border border-[#22c55e]/40'
            : 'bg-[#ef4444]/15 border border-[#ef4444]/40'
        }`}>
          <div className="flex justify-between items-center mb-3 text-lg font-semibold">
            <span>{state.lastResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</span>
            <span className="text-sm font-normal text-white/70">Score: {state.lastResult.score}/100</span>
          </div>

          {/* GTO Breakdown */}
          <div className="flex flex-col gap-2">
            {(['fold', 'call', 'raise'] as const).map(action => {
              const freq = state.lastResult!.gtoFreqs[action];
              const isUserChoice = action === state.lastAction;
              return (
                <div key={action} className="flex items-center gap-2">
                  <span className="w-12 text-sm font-medium capitalize">{action}</span>
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${freq * 100}%`,
                        background: action === 'fold' ? '#6b7280' : action === 'call' ? '#eab308' : '#22c55e'
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-white/70">{Math.round(freq * 100)}%</span>
                  {isUserChoice && <span className="text-xs text-[#ffd700] font-semibold">YOU</span>}
                </div>
              );
            })}
          </div>

          {!state.lastResult.isCorrect && (
            <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/70">
              💡 Optimal: <strong className="text-[#22c55e]">{state.lastResult.optimalAction.toUpperCase()}</strong>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex gap-2.5 p-5 bg-black/30">
        {state.showFeedback ? (
          <Button
            variant="primary"
            size="lg"
            icon={TrendingUp}
            className="w-full text-lg font-bold uppercase"
            onClick={dealNewHand}
          >
            Next Hand
          </Button>
        ) : (
          <>
            <button
              className="flex-1 py-4 px-5 rounded-xl text-lg font-bold uppercase cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#fff' }}
              onClick={() => handleAction('fold')}
            >
              Fold
            </button>
            <button
              className="flex-1 py-4 px-5 rounded-xl text-lg font-bold uppercase cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000' }}
              onClick={() => handleAction('call')}
            >
              Call
            </button>
            <button
              className="flex-1 py-4 px-5 rounded-xl text-lg font-bold uppercase cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}
              onClick={() => handleAction('raise')}
            >
              Raise
            </button>
          </>
        )}
      </div>
    </div>
  );
}
