'use client';

import { useMemo } from 'react';
import { useChinesePokerTraining } from '@/hooks/useChinesePokerTraining';
import { ScoringRule } from '@/utils/chinese-poker/scoring/basic-scoring';
import ArrangementBoard from '@/components/chinese-poker/ArrangementBoard';
import AnalysisView from '@/components/chinese-poker/AnalysisView';
import styles from './page.module.css';

const PHASE_LABELS: Record<string, string> = {
  dealing: '准备阶段',
  arranging: '排列阶段',
  analyzing: '分析阶段',
  review: '复盘阶段'
};

const SCORING_RULE_OPTIONS = [
  {
    value: ScoringRule.ONE_ONE_ONE,
    label: '1-1-1 基础计分'
  },
  {
    value: ScoringRule.TWO_FOUR,
    label: '2-4 港式计分'
  },
  {
    value: ScoringRule.ONE_SIX,
    label: '1-6 大满贯'
  }
];

export default function ChinesePokerTrainingPage() {
  const {
    state,
    dealNewHand,
    submitArrangement,
    resetToDealing,
    setScoringRule,
    setNumOpponents
  } = useChinesePokerTraining();

  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;

  const opponentOptions = useMemo(() => [1, 2, 3], []);

  return (
    <main className={`${styles.page} gradient-bg`}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Chinese Poker Training</span>
          <h1 className={styles.title}>国标十三张训练模式</h1>
          <p className={styles.subtitle}>
            体验专业训练流程：发牌、排列、分析与复盘。优化你的 EV，并学习最佳拆牌路径。
          </p>
        </div>
        <div className={styles.phaseBadge}>
          <span className={styles.phaseLabel}>{phaseLabel}</span>
        </div>
      </header>

      <section className={styles.content}>
        {state.phase === 'dealing' && (
          <div className={styles.setupPanel}>
            <div className={styles.setupIntro}>
              <h2>开始训练</h2>
              <p>选择计分规则与对手数量，系统会根据设定模拟最优排列。</p>
            </div>
            <div className={styles.settingsGrid}>
              <label className={styles.settingCard}>
                <span className={styles.settingLabel}>计分规则</span>
                <select
                  className={styles.select}
                  value={state.scoringRule}
                  onChange={(event) => setScoringRule(event.target.value as ScoringRule)}
                >
                  {SCORING_RULE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.settingCard}>
                <span className={styles.settingLabel}>对手数量</span>
                <select
                  className={styles.select}
                  value={state.numOpponents}
                  onChange={(event) => setNumOpponents(Number(event.target.value))}
                >
                  {opponentOptions.map(option => (
                    <option key={option} value={option}>
                      {option} 位
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className={styles.primaryButton} type="button" onClick={dealNewHand}>
              开始发牌
            </button>
          </div>
        )}

        {state.phase === 'arranging' && (
          <div className={styles.arrangingPanel}>
            <ArrangementBoard cards={state.cards} onSubmit={submitArrangement} />
            {state.error && <div className={styles.errorBanner}>{state.error}</div>}
            <div className={styles.secondaryActions}>
              <button type="button" className={styles.secondaryButton} onClick={resetToDealing}>
                返回设置
              </button>
              <button type="button" className={styles.secondaryButton} onClick={dealNewHand}>
                换一手牌
              </button>
            </div>
          </div>
        )}

        {state.phase === 'analyzing' && (
          <div className={styles.loadingPanel}>
            <div className={styles.loader} />
            <h3>正在分析你的排列</h3>
            <p>模拟对局与最优策略对比中，预计几秒内完成。</p>
          </div>
        )}

        {state.phase === 'review' && state.analysis && state.playerArrangement && (
          <div className={styles.reviewPanel}>
            <AnalysisView analysis={state.analysis} playerArrangement={state.playerArrangement} />
            <div className={styles.secondaryActions}>
              <button type="button" className={styles.secondaryButton} onClick={dealNewHand}>
                再来一局
              </button>
              <button type="button" className={styles.secondaryButton} onClick={resetToDealing}>
                返回设置
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
