'use client';

import styles from './ShoeIndicator.module.css';

interface ShoeIndicatorProps {
  remaining: number;
  total: number;
}

export default function ShoeIndicator({ remaining, total }: ShoeIndicatorProps) {
  const percentage = Math.round((remaining / total) * 100);
  const shouldShuffle = percentage <= 25;
  
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🃏</div>
      <div className={styles.info}>
        <div className={styles.count}>{remaining}</div>
        <div className={`${styles.percentage} ${shouldShuffle ? styles.warning : ''}`}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}
