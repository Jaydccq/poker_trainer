'use client';

import { Arrangement } from '@/types/chinese-poker';
import { AnalysisResult } from '@/utils/chinese-poker/solver/analyzer';
import PokerCard from './PokerCard';
import styles from './AnalysisView.module.css';

interface AnalysisViewProps {
  analysis: AnalysisResult;
  playerArrangement: Arrangement;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

function ArrangementPreview({ title, arrangement }: { title: string; arrangement: Arrangement }) {
  return (
    <div className={styles.previewBlock}>
      <div className={styles.previewTitle}>{title}</div>
      <div className={styles.previewRows}>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>前墩</span>
          <div className={styles.cardRow}>
            {arrangement.front.map(card => (
              <PokerCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
            ))}
          </div>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>中墩</span>
          <div className={styles.cardRow}>
            {arrangement.middle.map(card => (
              <PokerCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
            ))}
          </div>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>后墩</span>
          <div className={styles.cardRow}>
            {arrangement.back.map(card => (
              <PokerCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisView({ analysis, playerArrangement }: AnalysisViewProps) {
  const evLoss = analysis.evDifference;
  const lossLabel = evLoss >= 0 ? `-${evLoss.toFixed(2)}` : `+${Math.abs(evLoss).toFixed(2)}`;

  return (
    <div className={styles.container}>
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>你的 EV</span>
          <span className={styles.metricValue}>{analysis.playerEV.toFixed(2)}</span>
          <span className={styles.metricSub}>最优 EV: {analysis.optimalEV.toFixed(2)}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>EV 差异</span>
          <span className={styles.metricValue}>{lossLabel}</span>
          <span className={styles.metricSub}>{analysis.isOptimal ? '接近最优' : '仍有优化空间'}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>胜率对比</span>
          <span className={styles.metricValue}>{formatPercent(analysis.playerWinRate)}</span>
          <span className={styles.metricSub}>最优: {formatPercent(analysis.optimalWinRate)}</span>
        </div>
      </div>

      <div className={styles.previewGrid}>
        <ArrangementPreview title="你的排列" arrangement={playerArrangement} />
        <ArrangementPreview title="最优排列预览" arrangement={analysis.optimalArrangement} />
      </div>

      <div className={styles.suggestions}>
        <div className={styles.suggestionHeader}>改进建议</div>
        {analysis.suggestions.length === 0 ? (
          <div className={styles.suggestionEmpty}>当前排列表现不错，继续保持。</div>
        ) : (
          <ul className={styles.suggestionList}>
            {analysis.suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}-${index}`} className={styles.suggestionItem}>
                <span>{suggestion.message}</span>
                {typeof suggestion.evImpact === 'number' && (
                  <span className={styles.suggestionImpact}>EV -{suggestion.evImpact.toFixed(2)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
