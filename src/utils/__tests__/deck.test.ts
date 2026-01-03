import { createDeck, createShoe, shuffle, dealCard } from '../deck';

describe('Deck and Shoe', () => {
  describe('createDeck', () => {
    it('should create a standard 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 4 suits', () => {
      const deck = createDeck();
      const suits = new Set(deck.map(c => c.suit));
      expect(suits.size).toBe(4);
    });

    it('should have 13 ranks per suit', () => {
      const deck = createDeck();
      const hearts = deck.filter(c => c.suit === 'hearts');
      expect(hearts).toHaveLength(13);
    });

    it('should have correct values for face cards', () => {
      const deck = createDeck();
      const jack = deck.find(c => c.rank === 'J');
      const queen = deck.find(c => c.rank === 'Q');
      const king = deck.find(c => c.rank === 'K');
      
      expect(jack?.value).toBe(10);
      expect(queen?.value).toBe(10);
      expect(king?.value).toBe(10);
    });

    it('should have correct value for Ace', () => {
      const deck = createDeck();
      const ace = deck.find(c => c.rank === 'A');
      expect(ace?.value).toBe(11);
    });
  });

  describe('createShoe', () => {
    it('should create a shoe with multiple decks', () => {
      const shoe6 = createShoe(6);
      expect(shoe6.length).toBe(312); // 6 * 52

      const shoe1 = createShoe(1);
      expect(shoe1.length).toBe(52);
    });

    it('should shuffle the shoe', () => {
      const shoe1 = createShoe(1, 12345);
      const shoe2 = createShoe(1, 67890);
      
      // Different seeds should produce different shuffles
      const different = shoe1.some((card, idx) => 
        card.rank !== shoe2[idx].rank || card.suit !== shoe2[idx].suit
      );
      expect(different).toBe(true);
    });
  });

  describe('shuffle with seeded randomness', () => {
    it('should produce consistent results with same seed', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      
      const shuffled1 = shuffle(deck1, 42);
      const shuffled2 = shuffle(deck2, 42);
      
      // Same seed should produce identical shuffle
      for (let i = 0; i < shuffled1.length; i++) {
        expect(shuffled1[i].rank).toBe(shuffled2[i].rank);
        expect(shuffled1[i].suit).toBe(shuffled2[i].suit);
      }
    });

    it('should produce different results with different seeds', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      
      const shuffled1 = shuffle(deck1, 111);
      const shuffled2 = shuffle(deck2, 222);
      
      // Different seeds should produce different shuffles
      const allSame = shuffled1.every((card, idx) => 
        card.rank === shuffled2[idx].rank && card.suit === shuffled2[idx].suit
      );
      expect(allSame).toBe(false);
    });

    it('should produce random shuffle without seed', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      
      const shuffled1 = shuffle(deck1);
      const shuffled2 = shuffle(deck2);
      
      // Without seed, should be different (extremely high probability)
      const allSame = shuffled1.every((card, idx) => 
        card.rank === shuffled2[idx].rank && card.suit === shuffled2[idx].suit
      );
      expect(allSame).toBe(false);
    });
  });

  describe('dealCard', () => {
    it('should deal cards from the end of the shoe', () => {
      const shoe = createShoe(1, 12345);
      const initialLength = shoe.length;
      const lastCard = shoe[shoe.length - 1];
      
      const dealtCard = dealCard(shoe);
      
      expect(dealtCard).toEqual(lastCard);
      expect(shoe.length).toBe(initialLength - 1);
    });

    it('should return undefined when shoe is empty', () => {
      const shoe: any[] = [];
      const card = dealCard(shoe);
      expect(card).toBeUndefined();
    });

    it('should deal multiple cards in sequence', () => {
      const shoe = createShoe(1, 99999);
      const card1 = dealCard(shoe);
      const card2 = dealCard(shoe);
      const card3 = dealCard(shoe);
      
      expect(card1).toBeDefined();
      expect(card2).toBeDefined();
      expect(card3).toBeDefined();
      expect(shoe.length).toBe(49); // 52 - 3
    });
  });
});
