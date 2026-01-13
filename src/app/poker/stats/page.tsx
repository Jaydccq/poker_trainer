'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface TrainingRecord {
  id: string;
  timestamp: number;
  scenarioId: string;
  hand: string;
  userAction: string;
  isCorrect: boolean;
  score: number;
}

interface AggregatedStats {
  totalHands: number;
  correctCount: number;
  averageScore: number;
  byScenario: Record<string, {
    hands: number;
    correct: number;
    avgScore: number;
  }>;
  worstHands: { hand: string; errorCount: number }[];
  recentRecords: TrainingRecord[];
}

function loadStats(): AggregatedStats {
  if (typeof window === 'undefined') {
    return getEmptyStats();
  }

  try {
    const data = localStorage.getItem('poker_training_stats');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }

  return getEmptyStats();
}

function getEmptyStats(): AggregatedStats {
  return {
    totalHands: 0,
    correctCount: 0,
    averageScore: 0,
    byScenario: {},
    worstHands: [],
    recentRecords: [],
  };
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AggregatedStats>(() => {
    if (typeof window === 'undefined') {
      return getEmptyStats();
    }
    return loadStats();
  });
  const [isLoaded] = useState(() => typeof window !== 'undefined');

  const accuracy = stats.totalHands > 0
    ? Math.round((stats.correctCount / stats.totalHands) * 100)
    : 0;

  const clearStats = () => {
    if (confirm('Are you sure you want to clear all training statistics?')) {
      localStorage.removeItem('poker_training_stats');
      setStats(getEmptyStats());
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
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
          Training Statistics
        </h1>
      </header>

      {!isLoaded ? (
        <div className="flex items-center justify-center h-[60vh] text-[#94A3B8]">
          Loading...
        </div>
      ) : stats.totalHands === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <BarChart3 className="w-20 h-20 text-[#7C3AED] mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-family-heading)' }}>
            No Training Data Yet
          </h2>
          <p className="text-[#94A3B8] mb-8">
            Start training to see your statistics here!
          </p>
          <Button
            variant="cta"
            icon={Target}
            onClick={() => router.push('/poker/training')}
          >
            Start Training
          </Button>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="stat" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#7C3AED]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalHands}</div>
                  <div className="text-xs text-[#94A3B8]">Hands</div>
                </div>
              </div>
            </Card>

            <Card variant="stat" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#22c55e]">{accuracy}%</div>
                  <div className="text-xs text-[#94A3B8]">Accuracy</div>
                </div>
              </div>
            </Card>

            <Card variant="stat" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F43F5E]/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#F43F5E]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.averageScore)}</div>
                  <div className="text-xs text-[#94A3B8]">Avg Score</div>
                </div>
              </div>
            </Card>

            <Card variant="stat" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.correctCount}</div>
                  <div className="text-xs text-[#94A3B8]">Correct</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Accuracy Progress */}
          <Card variant="glass">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
              Overall Accuracy
            </h2>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#94A3B8]">
              <span>0%</span>
              <span>{accuracy}%</span>
              <span>100%</span>
            </div>
          </Card>

          {/* Scenarios Breakdown */}
          {Object.keys(stats.byScenario).length > 0 && (
            <Card variant="glass">
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
                By Scenario
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.byScenario).map(([scenarioId, data]) => {
                  const scenarioAccuracy = Math.round((data.correct / data.hands) * 100);
                  return (
                    <div key={scenarioId} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{scenarioId}</span>
                        <span className="text-sm text-[#94A3B8]">
                          {data.hands} hands · {scenarioAccuracy}% accurate
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] transition-all duration-300"
                          style={{ width: `${scenarioAccuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Worst Hands */}
          {stats.worstHands.length > 0 && (
            <Card variant="glass">
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Hands to Practice
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stats.worstHands.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-center">
                    <div className="text-xl font-bold text-[#ffd700] mb-1">{item.hand}</div>
                    <div className="text-xs text-[#94A3B8]">{item.errorCount} errors</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="cta"
              icon={Target}
              className="flex-1"
              onClick={() => router.push('/poker/training')}
            >
              Continue Training
            </Button>
            <Button
              variant="secondary"
              onClick={clearStats}
            >
              Clear Stats
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
