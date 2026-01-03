# Reproducible Test Scenarios

This document provides reproducible test scenarios for manual verification of the blackjack game's basic strategy implementation.

## How to Use

Each scenario includes:
- **Seed value**: Use this in Settings to get reproducible card deals
- **Expected cards**: What cards should appear
- **Expected recommendation**: What the strategy should suggest
- **Manual steps**: How to verify in the browser

## Test Seeds and Scenarios

### HARD 12 Scenarios

#### Scenario: HARD 12 vs Dealer 2 (HIT)
- **Seed**: 11111
- **Setup**: Player has 10♥, 2♦ (HARD 12), Dealer shows 2
- **Expected Action**: **HIT**
- **Reason**: 12 vs 2/3 is too weak to stand, dealer 2/3 aren't weak enough

#### Scenario: HARD 12 vs Dealer 4 (STAND)
- **Player Hand**: 10♠, 2♣ (HARD 12)
- **Dealer Upcard**: 4
- **Expected Action**: **STAND**
- **Reason**: Against weak dealer cards (4-6), let dealer risk busting

#### Scenario: HARD 12 vs Dealer 7 (HIT)
- **Player Hand**: 10♦, 2♥ (HARD 12)
- **Dealer Upcard**: 7
- **Expected Action**: **HIT**
- **Reason**: Dealer 7 is strong, must improve hand

---

### SOFT A7 (18) Scenarios

#### Scenario: SOFT A7 vs Dealer 2 (STAND if can't double)
- **Seed**: 22222
- **Player Hand**: A♥, 7♦ (SOFT 18)
- **Dealer Upcard**: 2
- **Expected Action**: **STAND** (if cannot double)
- **Note**: With S17 rules and ability to double, some variations double here

#### Scenario: SOFT A7 vs Dealer 5 (DOUBLE)
- **Seed**: 22222
- **Player Hand**: A♣, 7♠ (SOFT 18)
- **Dealer Upcard**: 5
- **Expected Action**: **DOUBLE** (if possible), otherwise **HIT**
- **Reason**: Dealer 5-6 are weakest cards, double down for profit

#### Scenario: SOFT A7 vs Dealer 9 (HIT)
- **Seed**: 22222
- **Player Hand**: A♦, 7♥ (SOFT 18)
- **Dealer Upcard**: 9
- **Expected Action**: **HIT**
- **Reason**: 18 isn't safe enough against strong dealer 9/10/A

---

### PAIR Split Scenarios

#### Scenario: PAIR 88 (ALWAYS SPLIT)
- **Seed**: 33333
- **Player Hand**: 8♥, 8♦ (PAIR 88)
- **Dealer Upcard**: 2, 5, 7, 10, A (any card)
- **Expected Action**: **SPLIT**
- **Reason**: 16 is worst hand, splitting into two 8s is always better

**Test against multiple dealers:**
- vs 2: SPLIT ✓
- vs 7: SPLIT ✓
- vs 10: SPLIT ✓
- vs A: SPLIT ✓

#### Scenario: PAIR AA (ALWAYS SPLIT)
- **Seed**: 33333
- **Player Hand**: A♣, A♠ (PAIR AA)
- **Dealer Upcard**: Any
- **Expected Action**: **SPLIT**
- **Reason**: Two hands starting at 11 is much better than one soft 12

**Test against:**
- vs 5: SPLIT ✓
- vs 10: SPLIT ✓

#### Scenario: PAIR 99 Split Conditionally
- **Seed**: 33333
- **Player Hand**: 9♥, 9♦ (PAIR 99)

**Should SPLIT against:** 2, 3, 4, 5, 6, 8, 9
- vs 2: SPLIT ✓
- vs 4: SPLIT ✓
- vs 6: SPLIT ✓
- vs 8: SPLIT ✓
- vs 9: SPLIT ✓

**Should STAND against:** 7, 10, A
- vs 7: STAND (18 is good enough)
- vs 10: STAND (splitting vs 10 is risky)
- vs A: STAND (splitting vs A is risky)

---

## Manual Verification Steps

### Setup
1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/game?mode=training`
3. Open Settings
4. Set the seed value as specified in each scenario
5. Set rules to: S17, 3:2, DAS enabled, Late Surrender enabled

### For Each Scenario

1. **Deal Hand**: Click "Deal" to start a new hand
2. **Verify Cards**: Check that player and dealer cards match expected scenario
3. **Check Recommendation**: In training mode, the game should highlight the correct action
4. **Take Action**: Try both correct and incorrect actions to verify feedback
5. **Verify Outcome**: Ensure settlement is calculated correctly

### Key Test Points

- ✅ Ace should count as 11 when possible, 1 when necessary
- ✅ Soft hands correctly identified (contains ace valued at 11)
- ✅ Hard hands correctly identified (no aces or aces valued at 1)
- ✅ Double only available with exactly 2 cards
- ✅ Split creates two separate hands
- ✅ Settlement:
  - Win: 2x bet returned
  - Lose: Lose entire bet
  - Push: Original bet returned
  - Blackjack: 1.5x bet + original (total 2.5x)
  - Surrender: 0.5x bet returned

---

## Running Automated Tests

Instead of manual verification, you can run the automated test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Expected Test Results

All tests should pass:
- ✅ Hand calculation tests (Ace scoring, soft/hard determination)
- ✅ Deck and shoe tests (seeded randomness)
- ✅ Strategy tests (HARD 12, SOFT A7, PAIR splits)
- ✅ Reproducible scenario tests

### Coverage Goals

- Lines: >70%
- Functions: >70%
- Branches: >70%
- Statements: >70%

---

## Troubleshooting

**Issue**: Cards don't match expected scenario
- **Solution**: Verify seed is set correctly in Settings
- **Note**: Seed must be set BEFORE dealing the hand

**Issue**: Recommendation doesn't match
- **Solution**: Check that rules match (S17, DAS, Late Surrender)
- **Note**: H17 rules will have different recommendations

**Issue**: Tests failing
- **Solution**: Run `npm test` to see detailed error messages
- **Check**: Ensure all dependencies are installed with `npm install`
