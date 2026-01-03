'use client';

import { useEffect } from 'react';
import { Action, StrategyRecommendation } from '@/types';
import { useI18n, TranslationKey } from '@/hooks/useI18n';
import styles from './TrainingFeedback.module.css';

interface TrainingFeedbackProps {
  isCorrect: boolean;
  chosenAction: Action;
  recommendation: StrategyRecommendation;
  onContinue: (useRecommended: boolean) => void;
  isWaiting?: boolean;
  isTransitioning?: boolean;
}

const actionToKey: Record<Action, TranslationKey> = {
  hit: 'hit',
  stand: 'stand',
  double: 'double',
  split: 'split',
  surrender: 'surrender',
  insurance: 'insurance',
};

export default function TrainingFeedback({
  isCorrect,
  chosenAction,
  recommendation,
  onContinue,
  isWaiting = false,
  isTransitioning = false,
}: TrainingFeedbackProps) {
  const { t, language } = useI18n();
  
  // Auto execute after 1.5 seconds only when waiting
  useEffect(() => {
    if (isWaiting) {
      const timer = setTimeout(() => {
        onContinue(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isWaiting, onContinue]);
  
  return (
    <div className={`${styles.sidebar} ${isTransitioning ? styles.transitioning : ''}`}>
      {/* Result indicator */}
      <div className={`${styles.result} ${isCorrect ? styles.correct : styles.incorrect}`}>
        <span className={styles.icon}>{isCorrect ? '✅' : '❌'}</span>
        <span className={styles.resultText}>
          {isCorrect ? t('correct') : t('incorrect')}
        </span>
      </div>
      
      {/* Show recommended action if wrong */}
      {!isCorrect && (
        <div className={styles.recommendation}>
          <div className={styles.label}>{t('recommended')}:</div>
          <div className={styles.value}>
            {t(actionToKey[recommendation.bestAction])}
          </div>
        </div>
      )}
      
      {/* Show reason */}
      <div className={styles.reason}>
        <div className={styles.label}>{t('reason')}:</div>
        <p>{language === 'zh' ? recommendation.reason.zh : recommendation.reason.en}</p>
      </div>
    </div>
  );
}
