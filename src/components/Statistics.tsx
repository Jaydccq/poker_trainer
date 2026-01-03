'use client';

import { useState } from 'react';
import { Statistics as StatsType, DecisionRecord, Action } from '@/types';
import { useI18n } from '@/hooks/useI18n';
import styles from './Statistics.module.css';

interface StatisticsProps {
  stats: StatsType;
  recentRecords: DecisionRecord[];
  onClearRecords: () => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<Action, { zh: string; en: string }> = {
  hit: { zh: '要牌', en: 'Hit' },
  stand: { zh: '停牌', en: 'Stand' },
  double: { zh: '加倍', en: 'Double' },
  split: { zh: '分牌', en: 'Split' },
  surrender: { zh: '投降', en: 'Surrender' },
  insurance: { zh: '保险', en: 'Insurance' },
};

export default function Statistics({ 
  stats, 
  recentRecords, 
  onClearRecords, 
  onClose 
}: StatisticsProps) {
  const { t, language } = useI18n();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const accuracy = stats.totalDecisions > 0 
    ? Math.round((stats.correctDecisions / stats.totalDecisions) * 100) 
    : 0;
  
  const getTypeAccuracy = (type: 'hard' | 'soft' | 'pair') => {
    const data = stats.byHandType[type];
    if (data.total === 0) return 0;
    return Math.round((data.correct / data.total) * 100);
  };
  
  const getActionLabel = (action: Action) => {
    return language === 'zh' ? ACTION_LABELS[action].zh : ACTION_LABELS[action].en;
  };
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t('stats')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.mainStat}>
            <span className={styles.bigNumber}>{accuracy}%</span>
            <span className={styles.label}>{t('accuracy')}</span>
            <span className={styles.subLabel}>
              {stats.correctDecisions} / {stats.totalDecisions}
            </span>
          </div>
          
          <div className={styles.categories}>
            <div className={styles.category}>
              <span className={styles.catLabel}>Hard</span>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill} 
                  style={{ width: `${getTypeAccuracy('hard')}%` }}
                />
              </div>
              <span className={styles.catPercent}>{getTypeAccuracy('hard')}%</span>
            </div>
            <div className={styles.category}>
              <span className={styles.catLabel}>Soft</span>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill} 
                  style={{ width: `${getTypeAccuracy('soft')}%` }}
                />
              </div>
              <span className={styles.catPercent}>{getTypeAccuracy('soft')}%</span>
            </div>
            <div className={styles.category}>
              <span className={styles.catLabel}>Pair</span>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill} 
                  style={{ width: `${getTypeAccuracy('pair')}%` }}
                />
              </div>
              <span className={styles.catPercent}>{getTypeAccuracy('pair')}%</span>
            </div>
          </div>
          
          {stats.topErrors.length > 0 && (
            <div className={styles.section}>
              <h3>{t('topErrors')}</h3>
              <div className={styles.errorList}>
                {stats.topErrors.slice(0, 5).map((error, index) => {
                  const itemKey = `error-${index}`;
                  // Find the most recent record with this error to get best action
                  const record = recentRecords.find(
                    r => r.handKey === error.handKey && 
                         r.dealerUpcard === error.dealerUpcard && 
                         !r.correct
                  );
                  
                  return (
                    <div 
                      key={index} 
                      className={styles.errorItem}
                      onMouseEnter={() => setHoveredItem(itemKey)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className={styles.errorRank}>#{index + 1}</span>
                      <span className={styles.errorHand}>{error.handKey}</span>
                      <span className={styles.errorDealer}>vs {error.dealerUpcard}</span>
                      <span className={styles.errorCount}>×{error.errorCount}</span>
                      
                      {hoveredItem === itemKey && record && (
                        <div className={styles.tooltip}>
                          <div className={styles.tooltipTitle}>
                            {language === 'zh' ? '正确策略' : 'Correct Strategy'}
                          </div>
                          <div className={styles.tooltipAction}>
                            {getActionLabel(record.bestAction)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {recentRecords.length > 0 && (
            <div className={styles.section}>
              <h3>{t('recentHistory')}</h3>
              <div className={styles.historyList}>
                {recentRecords.slice(0, 10).map((record, index) => {
                  const itemKey = `history-${index}`;
                  
                  return (
                    <div 
                      key={index} 
                      className={styles.historyItem}
                      onMouseEnter={() => setHoveredItem(itemKey)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className={record.correct ? styles.correct : styles.incorrect}>
                        {record.correct ? '✓' : '✗'}
                      </span>
                      <span className={styles.historyHand}>{record.handKey}</span>
                      <span className={styles.historyDealer}>vs {record.dealerUpcard}</span>
                      
                      {hoveredItem === itemKey && (
                        <div className={styles.tooltip}>
                          <div className={styles.tooltipTitle}>
                            {language === 'zh' ? '正确策略' : 'Correct Strategy'}
                          </div>
                          <div className={styles.tooltipAction}>
                            {getActionLabel(record.bestAction)}
                          </div>
                          {!record.correct && (
                            <div className={styles.tooltipChosen}>
                              {language === 'zh' ? '你选择了' : 'You chose'}: {getActionLabel(record.chosenAction)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <button className={styles.clearBtn} onClick={onClearRecords}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
