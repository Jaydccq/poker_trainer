'use client';

import React, { useState, useCallback } from 'react';
import styles from './BoardSelector.module.css';
import { Card, CardRank, CardSuit, parseCard, cardToString, RANKS_BY_VALUE, ALL_SUITS } from '@/poker/solver/cards';

interface BoardSelectorProps {
  board: Card[];
  onChange: (board: Card[]) => void;
  maxCards?: number;
}

const RANK_DISPLAY = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUIT_SYMBOLS: Record<CardSuit, string> = {
  's': '♠',
  'h': '♥',
  'd': '♦',
  'c': '♣',
};
const SUIT_COLORS: Record<CardSuit, string> = {
  's': '#1a1a2e',
  'h': '#dc2626',
  'd': '#3b82f6',
  'c': '#22c55e',
};

export default function BoardSelector({ board, onChange, maxCards = 5 }: BoardSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const isCardSelected = useCallback((rank: CardRank, suit: CardSuit) => {
    return board.some(c => c.rank === rank && c.suit === suit);
  }, [board]);

  const toggleCard = useCallback((rank: CardRank, suit: CardSuit) => {
    const existing = board.findIndex(c => c.rank === rank && c.suit === suit);
    
    if (existing >= 0) {
      // Remove card
      const newBoard = [...board];
      newBoard.splice(existing, 1);
      onChange(newBoard);
    } else if (board.length < maxCards) {
      // Add card
      onChange([...board, { rank, suit }]);
    }
  }, [board, maxCards, onChange]);

  const clearBoard = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const randomFlop = useCallback(() => {
    const allCards: Card[] = [];
    for (const suit of ALL_SUITS) {
      for (const rank of RANKS_BY_VALUE) {
        allCards.push({ rank, suit });
      }
    }
    
    // Fisher-Yates shuffle and take 3
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }
    
    onChange(allCards.slice(0, 3));
  }, [onChange]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Board</h4>
        <div className={styles.actions}>
          <button onClick={randomFlop} className={styles.smallBtn}>🎲 Random</button>
          <button onClick={clearBoard} className={styles.smallBtn}>Clear</button>
        </div>
      </div>

      {/* Display selected board cards */}
      <div className={styles.boardDisplay} onClick={() => setShowPicker(!showPicker)}>
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`${styles.boardSlot} ${idx < 3 ? styles.flop : idx === 3 ? styles.turn : styles.river}`}
          >
            {board[idx] ? (
              <div
                className={styles.selectedCard}
                style={{ color: SUIT_COLORS[board[idx].suit] }}
              >
                <span className={styles.cardRank}>{board[idx].rank}</span>
                <span className={styles.cardSuit}>{SUIT_SYMBOLS[board[idx].suit]}</span>
              </div>
            ) : (
              <div className={styles.emptySlot}>
                {idx < 3 ? 'F' : idx === 3 ? 'T' : 'R'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card picker */}
      {showPicker && (
        <div className={styles.picker}>
          <div className={styles.pickerGrid}>
            {ALL_SUITS.map(suit => (
              <div key={suit} className={styles.suitRow}>
                <span className={styles.suitLabel} style={{ color: SUIT_COLORS[suit] }}>
                  {SUIT_SYMBOLS[suit]}
                </span>
                {RANK_DISPLAY.map(rankStr => {
                  const rank = rankStr as CardRank;
                  const selected = isCardSelected(rank, suit);
                  return (
                    <button
                      key={`${rank}${suit}`}
                      className={`${styles.cardBtn} ${selected ? styles.selected : ''}`}
                      style={{ 
                        borderColor: selected ? SUIT_COLORS[suit] : undefined,
                        backgroundColor: selected ? `${SUIT_COLORS[suit]}20` : undefined,
                      }}
                      onClick={() => toggleCard(rank, suit)}
                      disabled={!selected && board.length >= maxCards}
                    >
                      <span style={{ color: SUIT_COLORS[suit] }}>{rank}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <button className={styles.closeBtn} onClick={() => setShowPicker(false)}>
            Done
          </button>
        </div>
      )}

      {/* Street indicator */}
      <div className={styles.streetInfo}>
        {board.length === 0 && <span>Click to add board cards</span>}
        {board.length === 3 && <span>Flop: {board.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(' ')}</span>}
        {board.length === 4 && <span>Turn: {board.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(' ')}</span>}
        {board.length === 5 && <span>River: {board.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(' ')}</span>}
        {board.length > 0 && board.length < 3 && <span>{board.length}/3 flop cards</span>}
      </div>
    </div>
  );
}
