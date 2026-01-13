"use client";

import { Card as CardType } from "@/types";

interface PlayingCardProps {
  card: CardType;
  faceDown?: boolean;
  className?: string;
  animateIn?: boolean;
  dealIndex?: number;
  isBlackjack?: boolean;
  isBust?: boolean;
}

export function PlayingCard({
  card,
  faceDown = false,
  className = "",
  animateIn = false,
  dealIndex = 0,
  isBlackjack = false,
  isBust = false
}: PlayingCardProps) {
  const suitSymbols: Record<CardType["suit"], string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  const suitSymbol = suitSymbols[card.suit];
  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  return (
    <div
      className={`
        relative w-16 h-24 rounded-lg shadow-lg
        transition-all duration-600
        ${animateIn ? "motion-safe:animate-[slideIn_0.3s_ease-out]" : ""}
        ${isBlackjack ? "shadow-[0_0_30px_rgba(212,175,55,0.8)] ring-2 ring-yellow-400/60" : ""}
        ${isBust ? "motion-safe:animate-shake ring-2 ring-red-500/50" : ""}
        ${className}
      `}
      style={{
        transform: faceDown ? "rotateY(180deg)" : "rotateY(0deg)",
        transformStyle: "preserve-3d",
        animationDelay: animateIn ? `${dealIndex * 200}ms` : "0ms",
      }}
    >
      {faceDown ? (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-900 via-red-800 to-red-950 border-2 border-yellow-600/50 shadow-2xl">
          <div className="absolute inset-2 rounded border border-yellow-600/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)]" />
        </div>
      ) : (
        <div className="absolute inset-0 rounded-lg bg-white border-2 border-gray-300 shadow-2xl p-2 flex flex-col justify-between">
          <div className={`text-2xl font-bold ${isRed ? "text-red-600" : "text-gray-900"}`}>
            {card.rank}
            <span className="ml-0.5">{suitSymbol}</span>
          </div>
          <div className={`text-5xl self-center ${isRed ? "text-red-600" : "text-gray-900"}`}>
            {suitSymbol}
          </div>
          <div className={`text-2xl font-bold self-end rotate-180 ${isRed ? "text-red-600" : "text-gray-900"}`}>
            {card.rank}
            <span className="ml-0.5">{suitSymbol}</span>
          </div>
        </div>
      )}
    </div>
  );
}
