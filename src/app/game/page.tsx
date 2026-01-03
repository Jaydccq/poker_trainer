'use client';

import { useState, useEffect, useRef } from 'react';
import { useGame, PendingFeedback } from '@/hooks/useGame';
import { useI18n } from '@/hooks/useI18n';
import { useStatistics } from '@/hooks/useStatistics';
import Header from '@/components/Header';
import Hand from '@/components/Hand';
import ActionBar from '@/components/ActionBar';
import TrainingFeedback from '@/components/TrainingFeedback';
import Settings from '@/components/Settings';
import Statistics from '@/components/Statistics';
import ShoeIndicator from '@/components/ShoeIndicator';
import ChipControls from '@/components/ChipControls';
import styles from './page.module.css';

import { useSearchParams, useRouter } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') as 'free' | 'training' || 'free';

  const { t } = useI18n();
  const {
    state,
    rules,
    currentHand,
    pendingFeedback,
    availableActions,
    dealNewHand,
    handleAction,
    handleFeedbackContinue,
    updateRules,
    placeBet,
    clearBet,
    resetToBetting,
  } = useGame(undefined, mode);
  
  const { 
    stats, 
    recordDecision, 
    clearRecords, 
    getRecentRecords 
  } = useStatistics();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Keep track of last feedback to persist sidebar
  const [displayFeedback, setDisplayFeedback] = useState<PendingFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Auto-deal countdown
  const [countdown, setCountdown] = useState(2);
  
  // Update display feedback when new pending feedback arrives
  useEffect(() => {
    if (pendingFeedback) {
      if (displayFeedback) {
        setIsTransitioning(true);
        setTimeout(() => {
          setDisplayFeedback(pendingFeedback);
          setIsTransitioning(false);
        }, 200);
      } else {
        setDisplayFeedback(pendingFeedback);
      }
      
      recordDecision(
        rules,
        pendingFeedback.handType as 'hard' | 'soft' | 'pair',
        pendingFeedback.handKey,
        pendingFeedback.dealerUpcard.rank,
        pendingFeedback.chosenAction,
        pendingFeedback.recommendation.bestAction,
        pendingFeedback.isCorrect
      );
    }
  }, [pendingFeedback]);
  
  const handleDealNewHand = () => {
    setDisplayFeedback(null);
    dealNewHand();
  };
  
  // Auto transition: Free mode -> auto deal, Training mode -> go to betting
  useEffect(() => {
    if (state.phase === 'settlement' && !isPaused) {
      if (mode === 'training') {
        // Training mode: wait 2 seconds then go back to betting screen
        const timer = setTimeout(() => {
          setDisplayFeedback(null);
          resetToBetting();
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        // Free mode: auto deal countdown
        setCountdown(2);
        const timer1 = setTimeout(() => setCountdown(1), 1000);
        const timer2 = setTimeout(() => {
          setDisplayFeedback(null);
          dealNewHand();
        }, 2000);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [state.phase, isPaused, mode, dealNewHand, resetToBetting]);
  
  const totalShoeCards = rules.decks * 52;
  const showSidebar = displayFeedback && state.phase !== 'betting';
  
  return (
    <div className={`${styles.container} ${state.phase === 'betting' ? styles.noPadding : ''} gradient-bg`}>
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        onBack={() => router.push('/')}
      />
      
      {/* Shoe indicator */}
      {state.phase !== 'betting' && (
        <ShoeIndicator 
          remaining={state.shoe.length} 
          total={totalShoeCards}
        />
      )}
      
      {/* Pause button */}
      {state.phase !== 'betting' && (
        <button 
          className={`${styles.pauseBtn} ${isPaused ? styles.paused : ''}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
      )}
      
      <main className={styles.main}>
        {state.phase === 'betting' ? (
          <div className={styles.startScreen}>
            {mode === 'training' ? (
              <ChipControls
                balance={state.chipBalance}
                currentBet={state.currentBet}
                onPlaceBet={placeBet}
                onClearBet={clearBet}
                onDeal={handleDealNewHand}
                minBet={15}
                runningCount={state.runningCount}
                trueCount={state.trueCount}
                showCounts={true}
                justRefilled={state.justRefilled}
              />
            ) : (
              <button 
                className={styles.dealBtn}
                onClick={handleDealNewHand}
              >
                🎴 {t('newGame')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Count panel - positioned outside gameArea for correct fixed positioning */}
            {mode === 'training' && (
              <div className={styles.countPanel}>
                <div className={styles.countItem}>
                  <label>Running Count</label>
                  <span>{state.runningCount > 0 ? `+${state.runningCount}` : state.runningCount}</span>
                </div>
                <div className={styles.countItem}>
                  <label>True Count</label>
                  <span>{state.trueCount > 0 ? `+${state.trueCount}` : state.trueCount}</span>
                </div>
                <div className={styles.countItem}>
                  <label>Chips</label>
                  <span>${state.chipBalance}</span>
                </div>
              </div>
            )}
            
            <div className={styles.gameArea}>
              <Hand 
                hand={state.dealerHand}
                label={t('dealer')}
                hideFirstCard={!state.dealerHoleCardRevealed}
              />
              
              <div className={styles.divider} />
              
              {state.playerHands.map((hand, index) => (
                <Hand 
                  key={index}
                  hand={hand}
                  label={state.playerHands.length > 1 
                    ? `${t('player')} ${index + 1}` 
                    : t('player')}
                  isActive={index === state.currentHandIndex && state.phase === 'playerTurn'}
                />
              ))}
              
              {state.phase === 'settlement' && (
                <div className={styles.results}>
                  <div className={styles.resultRow}>
                    {state.result.map((result, index) => (
                      <span 
                        key={index}
                        className={`${styles.result} ${styles[result]}`}
                      >
                        {result.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  {!isPaused && mode !== 'training' && (
                    <div className={styles.countdown}>
                      {countdown}s
                    </div>
                  )}
                  {mode === 'training' && (
                    <div className={styles.nextBetHint}>
                      Place your next bet...
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      {state.phase === 'playerTurn' && (
        <ActionBar 
          onAction={handleAction}
          disabled={!!pendingFeedback}
          {...availableActions}
        />
      )}
      
      {showSidebar && (
        <TrainingFeedback 
          isCorrect={displayFeedback.isCorrect}
          chosenAction={displayFeedback.chosenAction}
          recommendation={displayFeedback.recommendation}
          onContinue={handleFeedbackContinue}
          isWaiting={!!pendingFeedback}
          isTransitioning={isTransitioning}
        />
      )}
      
      {showSettings && (
        <Settings 
          rules={rules}
          onUpdateRules={updateRules}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showStats && (
        <Statistics 
          stats={stats}
          recentRecords={getRecentRecords(20)}
          onClearRecords={clearRecords}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
