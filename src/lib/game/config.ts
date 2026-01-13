import { GameRules } from "@/types";

/**
 * Default game rules for Blackjack
 * Shared configuration for both client and server
 */
export const DEFAULT_RULES: GameRules = {
  decks: 6,
  dealerRule: "S17",
  blackjackPayout: "3:2",
  doubleAnyTwoCards: true,
  doubleAfterSplit: true,
  acesSplitOneCard: true,
  lateSurrender: true,
  insuranceEnabled: true,
};
