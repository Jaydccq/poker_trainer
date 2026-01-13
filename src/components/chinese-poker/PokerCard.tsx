'use client';

import { Card } from '@/poker/solver/cards';
import styles from './PokerCard.module.css';

const SUIT_SYMBOLS: Record<Card['suit'], string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣'
};

const SUIT_COLORS: Record<Card['suit'], string> = {
  s: 'var(--color-card-black)',
  h: 'var(--color-card-red)',
  d: 'var(--color-card-red)',
  c: 'var(--color-card-black)'
};

const RANK_LABELS: Partial<Record<Card['rank'], string>> = {
  T: '10'
};

interface PokerCardProps {
  card: Card;
  size?: 'sm' | 'md';
  className?: string;
}

export default function PokerCard({ card, size = 'md', className }: PokerCardProps) {
  const classes = [styles.card, size === 'sm' ? styles.compact : '', className]
    .filter(Boolean)
    .join(' ');
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const rank = RANK_LABELS[card.rank] ?? card.rank;

  return (
    <div className={classes} style={{ color }}>
      <div className={styles.corner}>
        <span className={styles.rank}>{rank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
      <div className={styles.center}>{symbol}</div>
      <div className={`${styles.corner} ${styles.bottom}`}>
        <span className={styles.rank}>{rank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
    </div>
  );
}
