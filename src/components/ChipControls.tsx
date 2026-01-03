'use client';

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
function getBettingSuggestion(trueCount: number, minBet: number): { multiplier: number; suggestion: string; color: string } {
  if (trueCount <= 0) {
    return { multiplier: 1, suggestion: `Minimum bet ($${minBet})`, color: '#ef4444' };
  } else if (trueCount === 1) {
    return { multiplier: 1, suggestion: `Minimum bet ($${minBet})`, color: '#f59e0b' };
  } else if (trueCount === 2) {
    return { multiplier: 2, suggestion: `2x bet ($${minBet * 2})`, color: '#22c55e' };
  } else if (trueCount === 3) {
    return { multiplier: 3, suggestion: `3x bet ($${minBet * 3})`, color: '#22c55e' };
  } else if (trueCount === 4) {
    return { multiplier: 4, suggestion: `4x bet ($${minBet * 4})`, color: '#10b981' };
  } else {
    return { multiplier: 5, suggestion: `5x bet ($${minBet * 5}) - MAX`, color: '#06b6d4' };
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
  const { t } = useI18n();
  const chips = [10, 15, 20, 50, 100];
  const bettingSuggestion = getBettingSuggestion(trueCount, minBet);

  return (
    <div className={styles.container}>
      {justRefilled && (
        <div className={styles.refillNotice}>
          💰 Chips refilled to $1000! Keep practicing!
        </div>
      )}
      
      {showCounts && (
        <div className={styles.countPanel}>
          <div className={styles.countItem}>
            <label>Running Count</label>
            <span>{runningCount > 0 ? `+${runningCount}` : runningCount}</span>
          </div>
          <div className={styles.countItem}>
            <label>True Count</label>
            <span className={trueCount > 0 ? styles.positive : trueCount < 0 ? styles.negative : ''}>
              {trueCount > 0 ? `+${trueCount}` : trueCount}
            </span>
          </div>
          <div className={styles.suggestion} style={{ borderColor: bettingSuggestion.color }}>
            <span className={styles.suggestionLabel}>💡 Recommended:</span>
            <span className={styles.suggestionValue} style={{ color: bettingSuggestion.color }}>
              {bettingSuggestion.suggestion}
            </span>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <div className={styles.balance}>
          <span className={styles.label}>Balance:</span>
          <span className={styles.value}>${balance}</span>
        </div>
        <div className={styles.bet}>
          <span className={styles.label}>Bet:</span>
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
          Clear
        </button>
        <button 
          className={styles.dealBtn}
          onClick={onDeal}
          disabled={currentBet < minBet}
        >
          Deal
        </button>
      </div>
      
      {currentBet > 0 && currentBet < minBet && (
        <div className={styles.warning}>
          Min bet is ${minBet}
        </div>
      )}
    </div>
  );
}

