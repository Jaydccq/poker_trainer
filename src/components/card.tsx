"use client";
import { Card as CardType } from "@/types";
import styles from "./Card.module.css";
interface CardProps {
  card: CardType;
  hidden?: boolean;
}
const SUIT_SYMBOLS: Record<CardType["suit"], string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};
const SUIT_COLORS: Record<CardType["suit"], string> = {
  hearts: "#e74c3c",
  diamonds: "#e74c3c",
  clubs: "#2c3e50",
  spades: "#2c3e50",
};
export default function Card({ card, hidden = false }: CardProps) {
  if (hidden) {
    return (
      <div className={`${styles.card} ${styles.hidden}`}>
        <div className={styles.back}>🂠</div>
      </div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  return (
    <div className={styles.card} style={{ color }}>
      <div className={styles.corner}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
      <div className={styles.center}>{symbol}</div>
      <div className={`${styles.corner} ${styles.bottomRight}`}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
    </div>
  );
}
