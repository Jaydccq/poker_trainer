'use client';

import { Language } from '@/types';
import { useI18n } from '@/hooks/useI18n';
import styles from './ChipControls.module.css';

interface ChipControlsProps {
  balance: number;
  currentBet: number;
  onPlaceBet: (amount: number) => void;
  onClearBet: () => void;
  onDeal: () => void;
  minBet?: number;
  runningCount?: number;
  trueCount?: number;
  showCounts?: boolean;
  justRefilled?: boolean;
}

// Calculate suggested bet multiplier based on True Count
function getBettingSuggestion(
  language: Language,
  trueCount: number,
  minBet: number
): { multiplier: number; suggestion: string; color: string } {
  const formatBet = (multiplier: number) => `$${minBet * multiplier}`;
  const isZh = language === 'zh';

  if (trueCount <= 0) {
    return {
      multiplier: 1,
      suggestion: isZh ? `最低下注 (${formatBet(1)})` : `Minimum bet (${formatBet(1)})`,
      color: '#ef4444',
    };
  } else if (trueCount === 1) {
    return {
      multiplier: 1,
      suggestion: isZh ? `最低下注 (${formatBet(1)})` : `Minimum bet (${formatBet(1)})`,
      color: '#f59e0b',
    };
  } else if (trueCount === 2) {
    return {
      multiplier: 2,
      suggestion: isZh ? `2倍下注 (${formatBet(2)})` : `2x bet (${formatBet(2)})`,
      color: '#22c55e',
    };
  } else if (trueCount === 3) {
    return {
      multiplier: 3,
      suggestion: isZh ? `3倍下注 (${formatBet(3)})` : `3x bet (${formatBet(3)})`,
      color: '#22c55e',
    };
  } else if (trueCount === 4) {
    return {
      multiplier: 4,
      suggestion: isZh ? `4倍下注 (${formatBet(4)})` : `4x bet (${formatBet(4)})`,
      color: '#10b981',
    };
  } else {
    return {
      multiplier: 5,
      suggestion: isZh ? `5倍下注 (${formatBet(5)}) - 最高` : `5x bet (${formatBet(5)}) - MAX`,
      color: '#06b6d4',
    };
  }
}

export default function ChipControls({
  balance,
  currentBet,
  onPlaceBet,
  onClearBet,
  onDeal,
  minBet = 15,
  runningCount = 0,
  trueCount = 0,
  showCounts = false,
  justRefilled = false
}: ChipControlsProps) {
  const { t, language } = useI18n();
  const chips = [10, 15, 20, 50, 100];
  const bettingSuggestion = getBettingSuggestion(language, trueCount, minBet);

  return (
    <div className={styles.container}>
      {justRefilled && (
        <div className={styles.refillNotice}>
          💰 {t('refillNotice')}
        </div>
      )}
      
      {showCounts && (
        <div className={styles.countPanel}>
          <div className={styles.countItem}>
            <label>{t('runningCountLabel')}</label>
            <span>{runningCount > 0 ? `+${runningCount}` : runningCount}</span>
          </div>
          <div className={styles.countItem}>
            <label>{t('trueCountLabel')}</label>
            <span className={trueCount > 0 ? styles.positive : trueCount < 0 ? styles.negative : ''}>
              {trueCount > 0 ? `+${trueCount}` : trueCount}
            </span>
          </div>
          <div className={styles.suggestion} style={{ borderColor: bettingSuggestion.color }}>
            <span className={styles.suggestionLabel}>💡 {t('recommended')}:</span>
            <span className={styles.suggestionValue} style={{ color: bettingSuggestion.color }}>
              {bettingSuggestion.suggestion}
            </span>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <div className={styles.balance}>
          <span className={styles.label}>{t('balanceLabel')}:</span>
          <span className={styles.value}>${balance}</span>
        </div>
        <div className={styles.bet}>
          <span className={styles.label}>{t('betLabel')}:</span>
          <span className={styles.value}>${currentBet}</span>
        </div>
      </div>

      <div className={styles.chips}>
        {chips.map(amount => (
          <button
            key={amount}
            className={`${styles.chip} ${styles[`chip${amount}`]}`}
            onClick={() => onPlaceBet(amount)}
            disabled={balance < amount}
          >
            {amount}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.clearBtn}
          onClick={onClearBet}
          disabled={currentBet === 0}
        >
          {t('clear')}
        </button>
        <button 
          className={styles.dealBtn}
          onClick={onDeal}
          disabled={currentBet < minBet}
        >
          {t('deal')}
        </button>
      </div>
      
      {currentBet > 0 && currentBet < minBet && (
        <div className={styles.warning}>
          {t('minBetIs')} ${minBet}
        </div>
      )}
    </div>
  );
}
