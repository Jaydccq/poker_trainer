'use client';

import { useState, useCallback } from 'react';
import { DecisionRecord, Statistics, HandType, Rank, GameRules, Action } from '@/types';

const STORAGE_KEY = 'blackjack-decisions';
const MAX_RECORDS = 500;

function getInitialStats(): Statistics {
  return {
    totalDecisions: 0,
    correctDecisions: 0,
    byHandType: {
      hard: { total: 0, correct: 0 },
      soft: { total: 0, correct: 0 },
      pair: { total: 0, correct: 0 },
    },
    topErrors: [],
  };
}

export function useStatistics() {
  const loadRecords = (): DecisionRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as DecisionRecord[]) : [];
    } catch (e) {
      console.error('Failed to load decision records:', e);
      return [];
    }
  };

  const [records, setRecords] = useState<DecisionRecord[]>(loadRecords);
  const [stats, setStats] = useState<Statistics>(() => computeStats(loadRecords()));
  
  const recordDecision = useCallback((
    rules: GameRules,
    handType: HandType,
    handKey: string,
    dealerUpcard: Rank,
    chosenAction: Action,
    bestAction: Action,
    correct: boolean
  ) => {
    const newRecord: DecisionRecord = {
      timestamp: Date.now(),
      rules,
      handType,
      handKey,
      dealerUpcard,
      chosenAction,
      bestAction,
      correct,
    };
    
    setRecords(prev => {
      const updated = [newRecord, ...prev].slice(0, MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setStats(computeStats(updated));
      return updated;
    });
  }, []);
  
  const clearRecords = useCallback(() => {
    setRecords([]);
    setStats(getInitialStats());
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  const getRecentRecords = useCallback((n: number = 20): DecisionRecord[] => {
    return records.slice(0, n);
  }, [records]);
  
  return {
    stats,
    records,
    recordDecision,
    clearRecords,
    getRecentRecords,
  };
}

function computeStats(records: DecisionRecord[]): Statistics {
  const stats = getInitialStats();
  
  const errorMap = new Map<string, { handKey: string; dealerUpcard: Rank; count: number; lastError: number }>();
  
  for (const record of records) {
    stats.totalDecisions++;
    if (record.correct) {
      stats.correctDecisions++;
    }
    
    const handStats = stats.byHandType[record.handType];
    handStats.total++;
    if (record.correct) {
      handStats.correct++;
    }
    
    if (!record.correct) {
      const key = `${record.handKey}|${record.dealerUpcard}`;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
        existing.lastError = Math.max(existing.lastError, record.timestamp);
      } else {
        errorMap.set(key, {
          handKey: record.handKey,
          dealerUpcard: record.dealerUpcard,
          count: 1,
          lastError: record.timestamp,
        });
      }
    }
  }
  
  stats.topErrors = Array.from(errorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(e => ({
      handKey: e.handKey,
      dealerUpcard: e.dealerUpcard,
      errorCount: e.count,
      lastError: e.lastError,
    }));
  
  return stats;
}
