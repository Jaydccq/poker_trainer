'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

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

// Load stats from localStorage
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
  const [stats, setStats] = useState<AggregatedStats>(getEmptyStats());
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setStats(loadStats());
    setIsLoaded(true);
  }, []);
  
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
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← Back
        </button>
        <h1>Training Statistics</h1>
      </header>
      
      {!isLoaded ? (
        <div className={styles.loading}>Loading...</div>
      ) : stats.totalHands === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <h2>No Training Data Yet</h2>
          <p>Start training to see your statistics here!</p>
          <button 
            className={styles.startBtn}
            onClick={() => router.push('/poker/training')}
          >
            Start Training →
          </button>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className={styles.overviewGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🎯</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.totalHands}</span>
                <span className={styles.statLabel}>Hands Played</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>✅</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{accuracy}%</span>
                <span className={styles.statLabel}>Accuracy</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⭐</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{Math.round(stats.averageScore)}</span>
                <span className={styles.statLabel}>Avg Score</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📈</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.correctCount}</span>
                <span className={styles.statLabel}>Correct</span>
              </div>
            </div>
          </div>
          
          {/* Accuracy bar */}
          <div className={styles.section}>
            <h2>Overall Accuracy</h2>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <div className={styles.progressLabels}>
              <span>0%</span>
              <span className={styles.currentPct}>{accuracy}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Worst hands */}
          {stats.worstHands.length > 0 && (
            <div className={styles.section}>
              <h2>🔥 Hands to Practice</h2>
              <p className={styles.sectionDesc}>
                These hands have the most errors. Focus on these!
              </p>
              <div className={styles.worstHandsList}>
                {stats.worstHands.slice(0, 5).map((item, i) => (
                  <div key={item.hand} className={styles.worstHandItem}>
                    <span className={styles.rank}>#{i + 1}</span>
                    <span className={styles.handName}>{item.hand}</span>
                    <span className={styles.errorCount}>{item.errorCount} errors</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* By scenario */}
          {Object.keys(stats.byScenario).length > 0 && (
            <div className={styles.section}>
              <h2>📊 By Scenario</h2>
              <div className={styles.scenarioList}>
                {Object.entries(stats.byScenario).map(([id, data]) => (
                  <div key={id} className={styles.scenarioRow}>
                    <span className={styles.scenarioName}>{id}</span>
                    <div className={styles.scenarioStats}>
                      <span>{data.hands} hands</span>
                      <span>{Math.round((data.correct / data.hands) * 100)}%</span>
                      <span>Avg: {Math.round(data.avgScore)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recent records */}
          {stats.recentRecords.length > 0 && (
            <div className={styles.section}>
              <h2>📝 Recent Decisions</h2>
              <div className={styles.recentList}>
                {stats.recentRecords.slice(0, 10).map((record) => (
                  <div 
                    key={record.id} 
                    className={`${styles.recentItem} ${record.isCorrect ? styles.correct : styles.incorrect}`}
                  >
                    <span className={styles.recentHand}>{record.hand}</span>
                    <span className={styles.recentAction}>{record.userAction}</span>
                    <span className={styles.recentScore}>{record.score}</span>
                    <span className={styles.recentStatus}>
                      {record.isCorrect ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Clear button */}
          <div className={styles.actions}>
            <button className={styles.clearBtn} onClick={clearStats}>
              🗑️ Clear All Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}
