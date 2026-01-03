"use client";

import { Hand as HandType } from "@/types";
import Card from "./card";
import styles from "./Hand.module.css";

interface HandProps {
  hand: HandType;
  label: string;
  hideFirstCard?: boolean;
  isActive?: boolean;
}

export default function Hand({
  hand,
  label,
  hideFirstCard = false,
  isActive = false,
}: HandProps) {
  const displayTotal = () => {
    if (hideFirstCard) {
      return "?";
    }
    if (hand.isBlackjack) {
      return "BJ!";
    }
    const prefix = hand.isSoft ? "Soft " : "";
    return `${prefix}${hand.total}`;
  };
  
  return (
    <div className={`${styles.hand} ${isActive ? styles.active : ""}`}>
      <div className={styles.label}>
        {label}
        <span className={styles.total}>{displayTotal()}</span>
      </div>
      <div className={styles.cardsRow}>
        <div className={styles.cards}>
          {hand.cards.map((card, index) => (
            <div
              key={`${card.suit}-${card.rank}-${index}`}
              className={styles.cardWrapper}
              style={{ "--index": index } as React.CSSProperties}
            >
              <Card card={card} hidden={hideFirstCard && index === 0} />
            </div>
          ))}
        </div>
        {hand.isBusted && (
          <span className={styles.busted}>BUST</span>
        )}
      </div>
    </div>
  );
}
