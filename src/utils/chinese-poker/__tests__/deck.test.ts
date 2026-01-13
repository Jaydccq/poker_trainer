/**
 * Tests for deck management and card dealing
 */

import { Card } from '@/poker/solver/cards';
import {
  createDeck,
  shuffle,
  dealChinesePoker,
  validateCards
} from '../deck';

describe('Deck Management', () => {
  describe('createDeck', () => {
    it('should create a standard 52-card deck', () => {
      const deck = createDeck();

      expect(deck.length).toBe(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();
      const suits = ['h', 'd', 'c', 's'] as const;

      for (const suit of suits) {
        const suitCards = deck.filter(c => c.suit === suit);
        expect(suitCards.length).toBe(13);
      }
    });

    it('should have 4 cards of each rank', () => {
      const deck = createDeck();
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

      for (const rank of ranks) {
        const rankCards = deck.filter(c => c.rank === rank);
        expect(rankCards.length).toBe(4);
      }
    });

    it('should have no duplicates', () => {
      const deck = createDeck();
      const cardStrings = deck.map(c => `${c.rank}${c.suit}`);
      const uniqueCards = new Set(cardStrings);

      expect(uniqueCards.size).toBe(52);
    });
  });

  describe('shuffle', () => {
    it('should shuffle the deck', () => {
      const deck = createDeck();
      const shuffled = shuffle([...deck]);

      // Should have same cards
      expect(shuffled.length).toBe(52);

      // Should be in different order (with high probability)
      const isSameOrder = shuffled.every((card, i) =>
        card.rank === deck[i].rank && card.suit === deck[i].suit
      );
      expect(isSameOrder).toBe(false);
    });

    it('should produce different results without seed', () => {
      const deck = createDeck();
      const shuffled1 = shuffle([...deck]);
      const shuffled2 = shuffle([...deck]);

      const isSame = shuffled1.every((card, i) =>
        card.rank === shuffled2[i].rank && card.suit === shuffled2[i].suit
      );

      // Should be different (with high probability)
      expect(isSame).toBe(false);
    });

    it('should produce same results with same seed', () => {
      const deck = createDeck();
      const seed = 'test-seed-123';

      const shuffled1 = shuffle([...deck], seed);
      const shuffled2 = shuffle([...deck], seed);

      expect(shuffled1.length).toBe(52);
      expect(shuffled2.length).toBe(52);

      // Should be identical
      for (let i = 0; i < shuffled1.length; i++) {
        expect(shuffled1[i].rank).toBe(shuffled2[i].rank);
        expect(shuffled1[i].suit).toBe(shuffled2[i].suit);
      }
    });

    it('should produce different results with different seeds', () => {
      const deck = createDeck();

      const shuffled1 = shuffle([...deck], 'seed-1');
      const shuffled2 = shuffle([...deck], 'seed-2');

      const isSame = shuffled1.every((card, i) =>
        card.rank === shuffled2[i].rank && card.suit === shuffled2[i].suit
      );

      expect(isSame).toBe(false);
    });

    it('should not modify the original array', () => {
      const deck = createDeck();
      const original = [...deck];

      shuffle(deck);

      // Original should be unchanged
      for (let i = 0; i < original.length; i++) {
        expect(deck[i].rank).toBe(original[i].rank);
        expect(deck[i].suit).toBe(original[i].suit);
      }
    });
  });

  describe('dealChinesePoker', () => {
    it('should deal 13 cards to each player', () => {
      const hands = dealChinesePoker(2);

      expect(hands.length).toBe(2);
      expect(hands[0].cards.length).toBe(13);
      expect(hands[1].cards.length).toBe(13);
    });

    it('should support 2-4 players', () => {
      for (let numPlayers = 2; numPlayers <= 4; numPlayers++) {
        const hands = dealChinesePoker(numPlayers);

        expect(hands.length).toBe(numPlayers);
        hands.forEach(hand => {
          expect(hand.cards.length).toBe(13);
        });
      }
    });

    it('should throw error for invalid player count', () => {
      expect(() => dealChinesePoker(1)).toThrow('Chinese Poker requires 2-4 players');
      expect(() => dealChinesePoker(5)).toThrow('Chinese Poker requires 2-4 players');
    });

    it('should assign unique player IDs', () => {
      const hands = dealChinesePoker(3);
      const playerIds = hands.map(h => h.playerId);

      expect(new Set(playerIds).size).toBe(3);
      expect(playerIds).toEqual(['player_0', 'player_1', 'player_2']);
    });

    it('should deal no duplicate cards', () => {
      const hands = dealChinesePoker(4);
      const allCards: Card[] = [];

      hands.forEach(hand => {
        allCards.push(...hand.cards);
      });

      expect(allCards.length).toBe(52);

      const cardStrings = allCards.map(c => `${c.rank}${c.suit}`);
      const uniqueCards = new Set(cardStrings);

      expect(uniqueCards.size).toBe(52);
    });

    it('should produce deterministic deals with same seed', () => {
      const seed = 'test-deal-seed';

      const hands1 = dealChinesePoker(3, seed);
      const hands2 = dealChinesePoker(3, seed);

      expect(hands1.length).toBe(3);
      expect(hands2.length).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(hands1[i].cards.length).toBe(13);
        expect(hands2[i].cards.length).toBe(13);

        for (let j = 0; j < 13; j++) {
          expect(hands1[i].cards[j].rank).toBe(hands2[i].cards[j].rank);
          expect(hands1[i].cards[j].suit).toBe(hands2[i].cards[j].suit);
        }
      }
    });

    it('should produce different deals with different seeds', () => {
      const hands1 = dealChinesePoker(2, 'seed-1');
      const hands2 = dealChinesePoker(2, 'seed-2');

      const player1Hand1 = hands1[0].cards;
      const player1Hand2 = hands2[0].cards;

      const isSame = player1Hand1.every((card, i) =>
        card.rank === player1Hand2[i].rank && card.suit === player1Hand2[i].suit
      );

      expect(isSame).toBe(false);
    });

    it('should validate all dealt cards', () => {
      const hands = dealChinesePoker(3);

      hands.forEach(hand => {
        expect(validateCards(hand.cards)).toBe(true);
      });
    });
  });

  describe('validateCards', () => {
    it('should accept valid cards', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' }
      ];

      expect(validateCards(cards)).toBe(true);
    });

    it('should reject duplicate cards', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'A', suit: 'h' } // Duplicate!
      ];

      expect(validateCards(cards)).toBe(false);
    });

    it('should reject invalid cards not in deck', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'X' as any, suit: 'd' }
      ];

      expect(validateCards(cards)).toBe(false);
    });

    it('should handle empty array', () => {
      expect(validateCards([])).toBe(true);
    });
  });
});
