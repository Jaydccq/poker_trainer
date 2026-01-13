'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGame, PendingFeedback } from '@/hooks/useGame';
import { useI18n } from '@/hooks/useI18n';
import { useStatistics } from '@/hooks/useStatistics';
import { Play, Pause, ArrowLeft, Settings as SettingsIcon, BarChart3, Spade } from 'lucide-react';
import { Button } from '@/components/ui';
import Hand from '@/components/Hand';
import ActionBar from '@/components/ActionBar';
import TrainingFeedback from '@/components/TrainingFeedback';
import Settings from '@/components/Settings';
import Statistics from '@/components/Statistics';
import ShoeIndicator from '@/components/ShoeIndicator';
import ChipControls from '@/components/ChipControls';

export default function GameClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('mode') as 'free' | 'training') || 'free';

  const { t, language, toggleLanguage } = useI18n();
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
    getRecentRecords,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, isPaused, mode]);

  const totalShoeCards = rules.decks * 52;
  const showSidebar = displayFeedback && state.phase !== 'betting';

  return (
    <div className={`min-h-screen flex flex-col gradient-bg ${state.phase === 'betting' ? 'pb-0' : 'pb-[140px]'} gap-4`}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-black/20">
        <div className="flex items-center gap-3">
          {mode === 'training' && (
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => router.push('/')}
            >
              Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Spade className="w-6 h-6 text-[#7C3AED]" />
            <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 rounded-lg text-sm font-medium transition-all cursor-pointer"
            onClick={toggleLanguage}
          >
            {language === 'zh' ? 'EN' : '中'}
          </button>

          <Button
            variant="ghost"
            size="sm"
            icon={BarChart3}
            onClick={() => setShowStats(true)}
            aria-label={t('stats')}
          />

          <Button
            variant="ghost"
            size="sm"
            icon={SettingsIcon}
            onClick={() => setShowSettings(true)}
            aria-label={t('settings')}
          />
        </div>
      </header>

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
          className={`fixed left-4 top-[140px] w-11 h-11 bg-[#1A1A2E] border border-white/10 rounded-lg flex items-center justify-center z-50 transition-all cursor-pointer hover:bg-white/10 ${
            isPaused ? 'bg-[#7C3AED] border-[#7C3AED]' : ''
          }`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-white" />
          ) : (
            <Pause className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      <main className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {state.phase === 'betting' ? (
          <div className="flex-1 flex items-center justify-center w-full">
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
              <Button
                variant="primary"
                size="lg"
                icon={Spade}
                className="px-11 py-[18px] text-[17px] font-bold bg-gradient-to-br from-[#7C3AED] to-[#22c55e] shadow-[0_12px_28px_rgba(16,185,129,0.28)] hover:shadow-[0_16px_34px_rgba(16,185,129,0.35)]"
                onClick={handleDealNewHand}
              >
                {t('newGame')}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Count panel - positioned outside gameArea for correct fixed positioning */}
            {mode === 'training' && (
              <div className="fixed bottom-40 left-4 bg-[rgba(7,10,20,0.75)] backdrop-blur-xl p-4 sm:p-6 rounded-xl flex flex-col gap-3 border border-white/15 min-w-[160px] z-50 md:flex-row md:gap-4 md:w-auto">
                <div className="flex justify-between items-center text-white font-semibold gap-4">
                  <label className="text-white/70 text-sm font-medium whitespace-nowrap">
                    {t('runningCountLabel')}
                  </label>
                  <span className="font-mono text-lg min-w-[50px] text-right">
                    {state.runningCount > 0 ? `+${state.runningCount}` : state.runningCount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white font-semibold gap-4">
                  <label className="text-white/70 text-sm font-medium whitespace-nowrap">
                    {t('trueCountLabel')}
                  </label>
                  <span className="font-mono text-lg min-w-[50px] text-right">
                    {state.trueCount > 0 ? `+${state.trueCount}` : state.trueCount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white font-semibold gap-4">
                  <label className="text-white/70 text-sm font-medium whitespace-nowrap">
                    {t('chipsLabel')}
                  </label>
                  <span className="font-mono text-lg min-w-[50px] text-right">
                    ${state.chipBalance}
                  </span>
                </div>
              </div>
            )}

            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 lg:gap-8 z-10 w-[min(760px,92vw)] md:relative md:left-auto md:top-auto md:translate-x-0 md:translate-y-0">
              <Hand
                hand={state.dealerHand}
                label={t('dealer')}
                hideFirstCard={!state.dealerHoleCardRevealed}
              />

              <div className="w-[200px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-2 sm:my-4" />

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
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:static md:left-auto md:translate-x-0 md:mt-2">
                  <div className="flex gap-2 flex-wrap">
                    {state.result.map((result, index) => (
                      <span
                        key={index}
                        className={`px-6 py-2 rounded-[20px] font-bold text-base uppercase ${
                          result === 'win' || result === 'blackjack'
                            ? 'bg-[rgba(34,197,94,0.2)] text-[#22c55e]'
                            : result === 'lose'
                            ? 'bg-[rgba(239,68,68,0.2)] text-[#ef4444]'
                            : result === 'push'
                            ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]'
                            : 'bg-[rgba(156,163,175,0.2)] text-[#9ca3af]'
                        }`}
                      >
                        {result.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  {!isPaused && mode !== 'training' && (
                    <div className="text-sm text-[#94A3B8] font-semibold">
                      {countdown}s
                    </div>
                  )}
                  {mode === 'training' && (
                    <div className="mt-2 text-sm text-white/60 font-medium animate-pulse">
                      {t('placeNextBet')}
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
