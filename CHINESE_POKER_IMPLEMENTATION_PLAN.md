# Chinese Poker (十三水) Backend Implementation Plan

## Executive Summary

This document outlines the complete backend implementation for Chinese Poker (十三张, 十三水, Thirteen Cards, Roshambo Poker) based on game theory research and optimal strategy computation methods.

### Core Principles
- **No Real-Time Hints**: Players arrange cards freely without validation feedback
- **Post-Game Analysis**: Detailed review after submission (fouls, missed opportunities, optimal comparisons)
- **Deterministic**: Reproducible for replay and analysis
- **Multiplayer-Ready**: Backend designed for future online multiplayer extension

---

## Part 1: Game Mechanics & Rules

### 1.1 Basic Rules
- **Players**: 2-4 players (standard: 4 players)
- **Cards**: Each player receives 13 cards from a standard 52-card deck
- **Arrangement**: Players must split 13 cards into:
  - **Front Hand (头道)**: 3 cards
  - **Middle Hand (中道)**: 5 cards
  - **Back Hand (尾道)**: 5 cards

### 1.2 Core Constraint
**Back Hand ≥ Middle Hand ≥ Front Hand**

Violation = **Foul (倒水/相公)** → Automatic loss with penalty (typically -3 points to each opponent)

### 1.3 Hand Rankings

#### Front Hand (3 cards)
1. **Three of a Kind** (三条) - e.g., K-K-K
2. **Pair** (对子) - e.g., Q-Q-7
3. **High Card** (高牌) - e.g., A-K-5

#### Middle/Back Hands (5 cards - Standard Poker)
1. Royal Flush (皇家同花顺)
2. Straight Flush (同花顺)
3. Four of a Kind (四条/铁支)
4. Full House (葫芦/满堂红)
5. Flush (同花)
6. Straight (顺子)
7. Three of a Kind (三条)
8. Two Pair (两对)
9. One Pair (一对)
10. High Card (高牌)

### 1.4 Special Hands (Naturals - 特殊牌型)

These hands bypass normal arrangement and win automatically:

| Special Hand | Description | Standard Points | Variant Points |
|--------------|-------------|-----------------|----------------|
| **Dragon (一条龙)** | A-2-3-4-5-6-7-8-9-10-J-Q-K straight | 13 | 26 / Auto Grand Slam |
| **Six Pairs (六对半)** | 6 pairs + 1 kicker | 3 | 3-6 |
| **Three Flushes (三同花)** | All three hands are flushes | 3 | 3-4 |
| **Three Straights (三顺子)** | All three hands are straights | 3 | 3-4 |

**Decision Logic**: AI must compare `EV(normal arrangement)` vs `Points(special hand)` and choose higher value.

---

## Part 2: Scoring Systems

### 2.1 Basic Scoring (1-1-1 Rule)
- Win a line: +1 point
- Lose a line: -1 point
- **Strategy**: Lines are relatively independent, maximize each line's win probability

### 2.2 American/Hong Kong Scoring (2-4 Rule)
- Win 2 lines: +2 points (not 1+1-1=1)
- **Scoop** (全胜, win all 3 lines): +4 points (not 3)
- **Strategy**: High variance, aggressive pursuit of scoops

### 2.3 Grand Slam Scoring (1-6 Rule)
- Win 2 lines: +1 point
- **Scoop**: +6 points
- **Grand Slam** (全垒打): Scoop all opponents → score doubled or extra bonus
- **Strategy**: Extremely aggressive, willing to risk individual lines for scoop probability increase

### 2.4 Royalty (Bonus Points)

Additional points for strong hands in specific positions:

**Front Hand Royalty:**
- 6-6-x: +1
- 7-7-x: +2
- ...
- Q-Q-x: +7
- K-K-x: +8
- A-A-x: +9
- 2-2-2: +10
- 3-3-3: +11
- ...
- A-A-A: +22

**Middle Hand Royalty:**
- Three of a Kind: +2
- Straight: +4
- Flush: +8
- Full House: +12
- Four of a Kind: +20
- Straight Flush: +30
- Royal Flush: +50

**Back Hand Royalty:**
- Four of a Kind: +10
- Straight Flush: +15
- Royal Flush: +25

---

## Part 3: Algorithm Architecture

### 3.1 Combinatorial Complexity

**Deal Space:**
- C(52, 13) = **635,013,559,600** possible starting hands (~635 billion)

**Arrangement Space (per hand):**
- Theoretical: C(13,3) × C(10,5) × C(5,5) = **72,072** ways
- Valid (after constraint filtering): **100 - 2,000** typical
- Edge cases (special hands): **1** (auto-arrange)

**Key Insight**: Limited action space makes Chinese Poker computationally tractable for perfect solving.

### 3.2 Core Algorithm Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Chinese Poker Solver                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐                                  │
│  │  Hand Generator      │  → Enumerate valid 3-5-5 splits │
│  │  (with Pruning)      │     with constraint checking    │
│  └──────────────────────┘                                  │
│           ↓                                                 │
│  ┌──────────────────────┐                                  │
│  │  Hand Evaluator      │  → Calculate win probability    │
│  │  (LUT + Blocker)     │     vs opponent distributions   │
│  └──────────────────────┘                                  │
│           ↓                                                 │
│  ┌──────────────────────┐                                  │
│  │  EV Maximizer        │  → Combine scoring weights,     │
│  │  (Monte Carlo)       │     find optimal arrangement    │
│  └──────────────────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Hand Generator (Recursive Backtracking with Pruning)

**Algorithm:**
```typescript
function generateValidArrangements(cards: Card[]): Arrangement[] {
  const valid: Arrangement[] = [];

  // Step 1: Choose back hand (C(13, 5) = 1,287 combinations)
  for (const back of combinations(cards, 5)) {
    if (!isValidBack(back)) continue; // Early pruning

    const remaining8 = cards.filter(c => !back.includes(c));

    // Step 2: Choose middle hand (C(8, 5) = 56 combinations)
    for (const middle of combinations(remaining8, 5)) {
      // Constraint check: middle <= back
      if (compareHands(middle, back) > 0) continue; // Prune

      // Step 3: Front is remaining 3 cards
      const front = remaining8.filter(c => !middle.includes(c));

      // Constraint check: front <= middle
      if (compareHands(front, middle) > 0) continue; // Prune

      valid.push({ front, middle, back });
    }
  }

  return valid;
}
```

**Optimization**: Pruning at each layer reduces valid arrangements from 72,072 to hundreds.

### 3.4 Hand Evaluator (Look-Up Table + Blocker Correction)

**Pre-Computation:**
1. Simulate 100M+ hands to build cumulative distribution function (CDF)
2. For each possible hand, calculate percentile strength
3. Store in lookup tables:
   - `frontHandWinRate: Map<HandHash, number>`
   - `middleHandWinRate: Map<HandHash, number>`
   - `backHandWinRate: Map<HandHash, number>`

**Blocker Correction:**
```typescript
function adjustWinRateForBlockers(
  hand: Card[],
  myCards: Card[],
  baseWinRate: number
): number {
  // Cards I hold cannot be in opponent's hand
  // Example: If I hold 4 Aces, opponent front AA probability = 0
  // This makes my pair QQ more valuable

  const blockedCards = new Set(myCards);
  const adjustmentFactor = calculateBlockerImpact(hand, blockedCards);

  return baseWinRate * adjustmentFactor;
}
```

**Win Rate Reference (4-player game):**

| Back Hand | Example | Win % |
|-----------|---------|-------|
| Royal Flush | A♠ K♠ Q♠ J♠ 10♠ | 100% |
| Four of a Kind | 9-9-9-9-x | >99% |
| Full House (big) | A-A-A-K-K | 98% |
| Full House (small) | 2-2-2-3-3 | 90% |
| Flush (A-high) | A♠ K♠ 7♠ 5♠ 2♠ | 80% |
| Flush (6-high) | 6♥ 5♥ 4♥ 3♥ 2♥ | 55% |
| Straight (A-high) | A-K-Q-J-10 | 40% |
| Two Pair | A-A-K-K-x | 20% |

| Front Hand | Example | Win % |
|------------|---------|-------|
| Any Pair | 2-2-x | 60%+ |
| QQ or KK | Q-Q-x | ~90% |

### 3.5 Monte Carlo Simulation

**Algorithm:**
```typescript
function evaluateArrangementEV(
  arrangement: Arrangement,
  myCards: Card[],
  scoringRules: ScoringRules,
  iterations: number = 10000
): number {
  let totalScore = 0;
  const remainingDeck = allCards.filter(c => !myCards.includes(c)); // 39 cards

  for (let i = 0; i < iterations; i++) {
    // Deal to 3 opponents
    const shuffled = shuffle(remainingDeck);
    const opp1 = shuffled.slice(0, 13);
    const opp2 = shuffled.slice(13, 26);
    const opp3 = shuffled.slice(26, 39);

    // Simulate opponent strategies (greedy or table-based)
    const opp1Arr = findOptimalArrangement(opp1);
    const opp2Arr = findOptimalArrangement(opp2);
    const opp3Arr = findOptimalArrangement(opp3);

    // Compare and score
    const score = calculateScore(
      arrangement,
      [opp1Arr, opp2Arr, opp3Arr],
      scoringRules
    );

    totalScore += score;
  }

  return totalScore / iterations; // Average EV
}
```

### 3.6 Expected Value (EV) Formula

```typescript
EV_total =
  Σ(i ∈ {Front, Middle, Back}) [P(Win_i) × W_i - P(Lose_i) × L_i]
  + EV_scoop
  + EV_royalty

where:
  P(Scoop) = P(Win_F ∩ Win_M ∩ Win_B)  // Joint probability (NOT independent!)
  EV_scoop = P(Scoop) × ScoopBonus - P(GetScooped) × ScoopPenalty
  EV_royalty = ExpectedRoyaltyPoints(Front, Middle, Back)
```

**Critical Note**: Front, Middle, Back win probabilities are NOT independent because card allocation is zero-sum. Strong back → weak front.

---

## Part 4: Strategy Insights from PDF

### 4.1 Back Hand Strategy
- **Foundation**: Prevents foul (catastrophic loss)
- **Threshold Theory**: Aim for "just strong enough" (e.g., A-high flush ~80% win rate)
- **Resource Transfer**: Don't over-invest; transfer excess strength to middle/front
- **AI Insight**: Small flush (6-high) in back has low value → consider breaking for middle straight

### 4.2 Middle Hand Strategy
- **Double Constraint**: Must satisfy Back ≥ Middle ≥ Front
- **Bonus Opportunity**: Full house in middle often worth +12 royalty points
- **Counter-Intuitive Play**: Sometimes worth making middle very weak (even high card) to preserve strong front, as long as back prevents foul

### 4.3 Front Hand Strategy
- **Decisive Battleground**: Often determines scoop vs non-scoop
- **Pair Dominance**: Any pair has 60%+ win rate; QQ/KK has ~90%
- **"Jamming the Front"**: When back/middle are solid, push all big cards to front
- **Last Defense**: If back/middle are doomed, invest everything in front to prevent being scooped

### 4.4 Common Human Mistakes

**"Tian Ji Horse Racing" Trap:**
- Humans sacrifice back to strengthen middle/front
- **AI Insight**: With scoop bonuses, balance > polarization
- Weak back loses scoop opportunity AND exposes to being scooped

**Blocker Blindness:**
- Not accounting for cards you hold
- Example: Holding 3 Kings makes opponent front KK very unlikely → your QQ gains value

**Flush Over-Valuation:**
- Small flush in back (9-high) often loses to bigger flushes or full houses
- Breaking flush for middle straight may have higher marginal EV

---

## Part 5: Implementation Roadmap

### Phase 2: Core Poker Hand Evaluation Engine

#### 2.1 Three-Card Hand Evaluator
**File**: `src/utils/chinese-poker/hand-3card.ts`

```typescript
export enum ThreeCardRank {
  HIGH_CARD = 0,
  PAIR = 1,
  THREE_OF_KIND = 2
}

export interface ThreeCardHandValue {
  rank: ThreeCardRank;
  primaryValue: number;   // For trips: trip rank; For pair: pair rank
  kickers: number[];      // Remaining cards in descending order
}

export function evaluateThreeCardHand(cards: Card[]): ThreeCardHandValue {
  // Implementation
}

export function compareThreeCardHands(
  hand1: ThreeCardHandValue,
  hand2: ThreeCardHandValue
): number {
  // Returns: -1 (hand1 < hand2), 0 (tie), 1 (hand1 > hand2)
}
```

**Test Cases**:
- K-K-K vs Q-Q-Q
- A-A-7 vs A-A-5
- K-Q-J vs K-Q-10
- 2-2-3 vs A-K-Q (pair always beats high card)

#### 2.2 Five-Card Hand Evaluator
**File**: `src/utils/chinese-poker/hand-5card.ts`

**Strategy**: Extend existing poker solver from `src/poker/solver/`

```typescript
import { evaluateHand } from '@/poker/solver/hand-evaluator';

export enum FiveCardRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

export interface FiveCardHandValue {
  rank: FiveCardRank;
  value: number;          // Absolute strength for comparison
  description: string;    // Human-readable (e.g., "Full House, Aces over Kings")
}

export function evaluateFiveCardHand(cards: Card[]): FiveCardHandValue {
  // Reuse or extend poker solver logic
}

export function compareFiveCardHands(
  hand1: FiveCardHandValue,
  hand2: FiveCardHandValue
): number {
  // Returns: -1 (hand1 < hand2), 0 (tie), 1 (hand1 > hand2)
}
```

**Test Cases**:
- Royal Flush vs Straight Flush
- A-A-A-K-K vs K-K-K-A-A
- A♠ K♠ 7♠ 5♠ 2♠ vs K♥ Q♥ J♥ 10♥ 9♥ (both flushes)
- A-K-Q-J-10 vs 2-3-4-5-6 (both straights)

#### 2.3 Mixed Hand Comparison
**File**: `src/utils/chinese-poker/comparison.ts`

```typescript
export function isBackStrongerThanMiddle(
  back: FiveCardHandValue,
  middle: FiveCardHandValue
): boolean {
  return compareFiveCardHands(back, middle) >= 0;
}

export function isMiddleStrongerThanFront(
  middle: FiveCardHandValue,
  front: ThreeCardHandValue
): boolean {
  // Special logic: 5-card hand always beats 3-card hand of same "type"
  // Example: Middle with pair 2-2 beats Front with pair A-A
  // This is rule-dependent, document clearly
}
```

### Phase 3: Chinese Poker Specific Logic

#### 3.1 Card Dealing and Deck Management
**File**: `src/utils/chinese-poker/deck.ts`

```typescript
export function dealChinesePoker(
  numPlayers: number,
  seed?: string
): PlayerHands[] {
  const deck = createDeck();
  const shuffled = shuffle(deck, seed); // Deterministic if seed provided

  const hands: PlayerHands[] = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push({
      playerId: i,
      cards: shuffled.slice(i * 13, (i + 1) * 13)
    });
  }

  return hands;
}
```

#### 3.2 Arrangement Validation
**File**: `src/utils/chinese-poker/validation.ts`

```typescript
export interface ArrangementValidation {
  isValid: boolean;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  type: 'MIDDLE_STRONGER_THAN_BACK' | 'FRONT_STRONGER_THAN_MIDDLE';
  message: string;
}

export function validateArrangement(
  front: Card[],
  middle: Card[],
  back: Card[]
): ArrangementValidation {
  const violations: ValidationViolation[] = [];

  // Check card counts
  if (front.length !== 3 || middle.length !== 5 || back.length !== 5) {
    violations.push({
      type: 'INVALID_CARD_COUNT',
      message: 'Must be 3-5-5 split'
    });
  }

  // Evaluate hands
  const frontValue = evaluateThreeCardHand(front);
  const middleValue = evaluateFiveCardHand(middle);
  const backValue = evaluateFiveCardHand(back);

  // Check constraints
  if (!isBackStrongerThanMiddle(backValue, middleValue)) {
    violations.push({
      type: 'MIDDLE_STRONGER_THAN_BACK',
      message: `Middle (${middleValue.description}) is stronger than Back (${backValue.description})`
    });
  }

  if (!isMiddleStrongerThanFront(middleValue, frontValue)) {
    violations.push({
      type: 'FRONT_STRONGER_THAN_MIDDLE',
      message: `Front (${frontValue.description}) is stronger than Middle (${middleValue.description})`
    });
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

export function isFoul(arrangement: Arrangement): boolean {
  return !validateArrangement(
    arrangement.front,
    arrangement.middle,
    arrangement.back
  ).isValid;
}
```

#### 3.3 Valid Arrangement Generator
**File**: `src/utils/chinese-poker/generator.ts`

```typescript
export interface GeneratorOptions {
  maxArrangements?: number;  // Limit output (default: all valid)
  pruningStrategy?: 'aggressive' | 'conservative';
}

export function generateValidArrangements(
  cards: Card[],
  options?: GeneratorOptions
): Arrangement[] {
  const valid: Arrangement[] = [];
  const maxCount = options?.maxArrangements ?? Infinity;

  // Nested loops with pruning (as described in 3.3)
  for (const back of combinations(cards, 5)) {
    // Early pruning: skip obviously weak backs that will foul
    if (options?.pruningStrategy === 'aggressive' && isTooWeak(back)) {
      continue;
    }

    const remaining8 = cards.filter(c => !back.includes(c));

    for (const middle of combinations(remaining8, 5)) {
      const backVal = evaluateFiveCardHand(back);
      const middleVal = evaluateFiveCardHand(middle);

      if (!isBackStrongerThanMiddle(backVal, middleVal)) {
        continue; // Prune entire branch
      }

      const front = remaining8.filter(c => !middle.includes(c));
      const frontVal = evaluateThreeCardHand(front);

      if (!isMiddleStrongerThanFront(middleVal, frontVal)) {
        continue; // Prune
      }

      valid.push({ front, middle, back });

      if (valid.length >= maxCount) {
        return valid;
      }
    }
  }

  return valid;
}
```

### Phase 4: Scoring System

#### 4.1 Special Hands Detection
**File**: `src/utils/chinese-poker/scoring/special-hands.ts`

```typescript
export enum SpecialHandType {
  NONE = 'NONE',
  DRAGON = 'DRAGON',              // 一条龙 (A-K straight)
  SIX_PAIRS = 'SIX_PAIRS',        // 六对半
  THREE_FLUSHES = 'THREE_FLUSHES', // 三同花
  THREE_STRAIGHTS = 'THREE_STRAIGHTS' // 三顺子
}

export interface SpecialHandResult {
  type: SpecialHandType;
  points: number;
  arrangement?: Arrangement; // Auto-arrangement if special hand
}

export function detectSpecialHand(
  cards: Card[],
  scoringRules: ScoringRules
): SpecialHandResult {
  // Check Dragon: A-2-3-4-5-6-7-8-9-10-J-Q-K
  if (isDragon(cards)) {
    return {
      type: SpecialHandType.DRAGON,
      points: scoringRules.specialHands.dragon,
      arrangement: arrangeDragon(cards)
    };
  }

  // Check Six Pairs
  if (isSixPairs(cards)) {
    return {
      type: SpecialHandType.SIX_PAIRS,
      points: scoringRules.specialHands.sixPairs,
      arrangement: arrangeSixPairs(cards)
    };
  }

  // Check Three Flushes (more complex, multiple arrangements possible)
  const threeFlushesArr = findThreeFlushes(cards);
  if (threeFlushesArr) {
    return {
      type: SpecialHandType.THREE_FLUSHES,
      points: scoringRules.specialHands.threeFlushes,
      arrangement: threeFlushesArr
    };
  }

  // Check Three Straights
  const threeStraightsArr = findThreeStraights(cards);
  if (threeStraightsArr) {
    return {
      type: SpecialHandType.THREE_STRAIGHTS,
      points: scoringRules.specialHands.threeStraights,
      arrangement: threeStraightsArr
    };
  }

  return { type: SpecialHandType.NONE, points: 0 };
}
```

#### 4.2 Basic Scoring
**File**: `src/utils/chinese-poker/scoring/basic-scoring.ts`

```typescript
export interface ScoringRules {
  type: '1-1-1' | '2-4' | '1-6';
  twoLinesBonus?: number;   // For 2-4 and 1-6 variants
  scoopBonus: number;       // 4 for 2-4, 6 for 1-6
  foulPenalty: number;      // Usually -3 per opponent
  specialHands: {
    dragon: number;
    sixPairs: number;
    threeFlushes: number;
    threeStraights: number;
  };
  royalty: RoyaltyRules;
}

export interface HeadToHeadResult {
  frontWinner: number;  // Player index or -1 for tie
  middleWinner: number;
  backWinner: number;
  playerScores: number[];
}

export function scoreHeadToHead(
  p1Arr: Arrangement,
  p2Arr: Arrangement,
  rules: ScoringRules
): HeadToHeadResult {
  // Handle fouls
  const p1Foul = isFoul(p1Arr);
  const p2Foul = isFoul(p2Arr);

  if (p1Foul && p2Foul) {
    return { /* both lose */ };
  }
  if (p1Foul) {
    return { /* p1 loses foul penalty */ };
  }
  if (p2Foul) {
    return { /* p2 loses foul penalty */ };
  }

  // Compare each line
  const frontComp = compareThreeCardHands(
    evaluateThreeCardHand(p1Arr.front),
    evaluateThreeCardHand(p2Arr.front)
  );
  const middleComp = compareFiveCardHands(
    evaluateFiveCardHand(p1Arr.middle),
    evaluateFiveCardHand(p2Arr.middle)
  );
  const backComp = compareFiveCardHands(
    evaluateFiveCardHand(p1Arr.back),
    evaluateFiveCardHand(p2Arr.back)
  );

  // Count wins
  const p1Wins = [frontComp > 0, middleComp > 0, backComp > 0].filter(Boolean).length;
  const p2Wins = [frontComp < 0, middleComp < 0, backComp < 0].filter(Boolean).length;

  // Calculate scores based on rules
  let p1Score = 0;
  let p2Score = 0;

  if (rules.type === '1-1-1') {
    p1Score = frontComp + middleComp + backComp;
    p2Score = -p1Score;
  } else if (rules.type === '2-4') {
    if (p1Wins === 3) {
      p1Score = rules.scoopBonus; // 4
      p2Score = -rules.scoopBonus;
    } else if (p2Wins === 3) {
      p2Score = rules.scoopBonus;
      p1Score = -rules.scoopBonus;
    } else {
      p1Score = p1Wins - p2Wins;
      p2Score = -p1Score;
    }
  } else if (rules.type === '1-6') {
    if (p1Wins === 3) {
      p1Score = rules.scoopBonus; // 6
      p2Score = -rules.scoopBonus;
    } else if (p2Wins === 3) {
      p2Score = rules.scoopBonus;
      p1Score = -rules.scoopBonus;
    } else if (p1Wins === 2) {
      p1Score = 1;
      p2Score = -1;
    } else if (p2Wins === 2) {
      p2Score = 1;
      p1Score = -1;
    }
  }

  // Add royalty
  p1Score += calculateRoyalty(p1Arr, rules.royalty);
  p2Score += calculateRoyalty(p2Arr, rules.royalty);

  return {
    frontWinner: frontComp > 0 ? 0 : (frontComp < 0 ? 1 : -1),
    middleWinner: middleComp > 0 ? 0 : (middleComp < 0 ? 1 : -1),
    backWinner: backComp > 0 ? 0 : (backComp < 0 ? 1 : -1),
    playerScores: [p1Score, p2Score]
  };
}

export function scoreMultiPlayer(
  arrangements: Arrangement[],
  rules: ScoringRules
): number[] {
  // For 4-player: Compare each player against all others
  // Return array of total scores
}
```

#### 4.3 Royalty System
**File**: `src/utils/chinese-poker/scoring/royalty.ts`

```typescript
export interface RoyaltyRules {
  front: Map<string, number>; // e.g., "PAIR_6" -> 1, "TRIPS_A" -> 22
  middle: Map<FiveCardRank, number>; // e.g., FULL_HOUSE -> 12
  back: Map<FiveCardRank, number>;   // e.g., FOUR_OF_KIND -> 10
}

export function calculateRoyalty(
  arrangement: Arrangement,
  rules: RoyaltyRules
): number {
  let total = 0;

  // Front royalty
  const frontVal = evaluateThreeCardHand(arrangement.front);
  total += getFrontRoyalty(frontVal, rules.front);

  // Middle royalty
  const middleVal = evaluateFiveCardHand(arrangement.middle);
  total += rules.middle.get(middleVal.rank) ?? 0;

  // Back royalty
  const backVal = evaluateFiveCardHand(arrangement.back);
  total += rules.back.get(backVal.rank) ?? 0;

  return total;
}
```

### Phase 5: Optimal Strategy and Analysis

#### 5.1 Win Probability Calculator (Look-Up Tables)
**File**: `src/chinese-poker/solver/evaluator.ts`

```typescript
export class HandEvaluator {
  private frontWinRates: Map<string, number>;
  private middleWinRates: Map<string, number>;
  private backWinRates: Map<string, number>;

  constructor() {
    // Load pre-computed tables (generated offline)
    this.frontWinRates = this.loadTable('front-win-rates.json');
    this.middleWinRates = this.loadTable('middle-win-rates.json');
    this.backWinRates = this.loadTable('back-win-rates.json');
  }

  getWinProbability(
    hand: Card[],
    position: 'front' | 'middle' | 'back',
    blockers?: Card[]
  ): number {
    const handHash = hashHand(hand);
    const baseWinRate = this.getTableWinRate(handHash, position);

    if (blockers && blockers.length > 0) {
      return this.adjustForBlockers(baseWinRate, hand, blockers);
    }

    return baseWinRate;
  }

  private adjustForBlockers(
    baseWinRate: number,
    hand: Card[],
    blockers: Card[]
  ): number {
    // Simplified blocker adjustment
    // Full implementation would recalculate opponent distribution

    const blockedHighCards = blockers.filter(c => c.rank >= Rank.JACK).length;
    const handHighCards = hand.filter(c => c.rank >= Rank.JACK).length;

    // If we hold many high cards, opponent less likely to have strong hands
    const adjustmentFactor = 1 + (blockedHighCards * 0.02);

    return Math.min(1.0, baseWinRate * adjustmentFactor);
  }
}
```

**Pre-computation Script** (run offline):
**File**: `scripts/generate-win-rate-tables.ts`

```typescript
// Simulate 100M hands to build CDF for each position
export async function generateWinRateTables() {
  const frontDistribution = new Map<string, number>();
  const middleDistribution = new Map<string, number>();
  const backDistribution = new Map<string, number>();

  const iterations = 100_000_000;

  for (let i = 0; i < iterations; i++) {
    const deck = shuffle(createDeck());
    const hand13 = deck.slice(0, 13);

    // Generate a random valid arrangement
    const arrangements = generateValidArrangements(hand13);
    if (arrangements.length === 0) continue;

    const arr = arrangements[Math.floor(Math.random() * arrangements.length)];

    // Hash and count
    frontDistribution.set(
      hashHand(arr.front),
      (frontDistribution.get(hashHand(arr.front)) ?? 0) + 1
    );
    middleDistribution.set(
      hashHand(arr.middle),
      (middleDistribution.get(hashHand(arr.middle)) ?? 0) + 1
    );
    backDistribution.set(
      hashHand(arr.back),
      (backDistribution.get(hashHand(arr.back)) ?? 0) + 1
    );
  }

  // Convert counts to win rates (percentile rank)
  const frontWinRates = convertToWinRates(frontDistribution);
  const middleWinRates = convertToWinRates(middleDistribution);
  const backWinRates = convertToWinRates(backDistribution);

  // Save to JSON files
  await saveTable('front-win-rates.json', frontWinRates);
  await saveTable('middle-win-rates.json', middleWinRates);
  await saveTable('back-win-rates.json', backWinRates);
}
```

#### 5.2 Monte Carlo Simulator
**File**: `src/chinese-poker/solver/monte-carlo.ts`

```typescript
export interface SimulationResult {
  averageScore: number;
  winRate: number;      // % of games won
  scoopRate: number;    // % of games scooped
  foulRate: number;     // % of games fouled
  distribution: {
    scores: Map<number, number>; // Score -> frequency
  };
}

export class MonteCarloSimulator {
  constructor(
    private evaluator: HandEvaluator,
    private scoringRules: ScoringRules
  ) {}

  simulate(
    arrangement: Arrangement,
    myCards: Card[],
    numOpponents: number = 3,
    iterations: number = 10000
  ): SimulationResult {
    const scores: number[] = [];
    let winCount = 0;
    let scoopCount = 0;

    const remainingDeck = createDeck().filter(c =>
      !myCards.some(mc => cardsEqual(mc, c))
    );

    for (let i = 0; i < iterations; i++) {
      const shuffled = shuffle(remainingDeck);

      // Deal to opponents
      const opponents: Arrangement[] = [];
      for (let j = 0; j < numOpponents; j++) {
        const oppCards = shuffled.slice(j * 13, (j + 1) * 13);
        const oppArr = this.findOptimalArrangement(oppCards);
        opponents.push(oppArr);
      }

      // Score this iteration
      const iterationScore = this.scoreAgainstOpponents(
        arrangement,
        opponents
      );

      scores.push(iterationScore);

      if (iterationScore > 0) winCount++;
      if (this.isScoopedAll(arrangement, opponents)) scoopCount++;
    }

    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / iterations,
      winRate: winCount / iterations,
      scoopRate: scoopCount / iterations,
      foulRate: 0, // arrangement is pre-validated
      distribution: {
        scores: this.buildDistribution(scores)
      }
    };
  }

  private findOptimalArrangement(cards: Card[]): Arrangement {
    // Opponent uses greedy strategy or table-based strategy
    // For simplicity, use greedy strategy
    const arrangements = generateValidArrangements(cards);

    if (arrangements.length === 0) {
      // Foul: return any invalid arrangement
      return {
        front: cards.slice(0, 3),
        middle: cards.slice(3, 8),
        back: cards.slice(8, 13)
      };
    }

    // Choose arrangement with highest expected individual line win rates
    let bestArr = arrangements[0];
    let bestScore = -Infinity;

    for (const arr of arrangements) {
      const score =
        this.evaluator.getWinProbability(arr.front, 'front') +
        this.evaluator.getWinProbability(arr.middle, 'middle') +
        this.evaluator.getWinProbability(arr.back, 'back');

      if (score > bestScore) {
        bestScore = score;
        bestArr = arr;
      }
    }

    return bestArr;
  }
}
```

#### 5.3 Expected Value (EV) Calculator
**File**: `src/chinese-poker/solver/ev-calculator.ts`

```typescript
export class EVCalculator {
  constructor(
    private evaluator: HandEvaluator,
    private scoringRules: ScoringRules
  ) {}

  calculateEV(
    arrangement: Arrangement,
    myCards: Card[],
    numOpponents: number = 3
  ): number {
    // Simplified EV (no Monte Carlo, just win probabilities)

    const pFront = this.evaluator.getWinProbability(
      arrangement.front,
      'front',
      myCards
    );
    const pMiddle = this.evaluator.getWinProbability(
      arrangement.middle,
      'middle',
      myCards
    );
    const pBack = this.evaluator.getWinProbability(
      arrangement.back,
      'back',
      myCards
    );

    // Individual line EV (simplified: assumes independence)
    let evBase = (2 * pFront - 1) + (2 * pMiddle - 1) + (2 * pBack - 1);
    evBase *= numOpponents; // Playing against multiple opponents

    // Scoop bonus (simplified: assume independence)
    const pScoop = pFront * pMiddle * pBack;
    const pGetScooped = (1 - pFront) * (1 - pMiddle) * (1 - pBack);

    const evScoop = pScoop * this.scoringRules.scoopBonus * numOpponents
                  - pGetScooped * this.scoringRules.scoopBonus;

    // Royalty
    const evRoyalty = calculateRoyalty(arrangement, this.scoringRules.royalty);

    return evBase + evScoop + evRoyalty;
  }
}
```

#### 5.4 Optimal Arrangement Finder
**File**: `src/chinese-poker/solver/optimizer.ts`

```typescript
export interface OptimalResult {
  arrangement: Arrangement;
  expectedValue: number;
  alternatives: Array<{
    arrangement: Arrangement;
    expectedValue: number;
    evDiff: number; // Difference from optimal
  }>;
}

export class ArrangementOptimizer {
  constructor(
    private evCalculator: EVCalculator,
    private mcSimulator?: MonteCarloSimulator
  ) {}

  findOptimal(
    cards: Card[],
    useMonteCarlo: boolean = false,
    mcIterations: number = 10000
  ): OptimalResult {
    // 1. Check special hands first
    const specialHand = detectSpecialHand(cards, this.evCalculator.scoringRules);
    if (specialHand.type !== SpecialHandType.NONE) {
      const normalEV = this.findNormalOptimal(cards).expectedValue;

      if (specialHand.points > normalEV) {
        return {
          arrangement: specialHand.arrangement!,
          expectedValue: specialHand.points,
          alternatives: []
        };
      }
    }

    return this.findNormalOptimal(cards, useMonteCarlo, mcIterations);
  }

  private findNormalOptimal(
    cards: Card[],
    useMonteCarlo: boolean = false,
    mcIterations: number = 10000
  ): OptimalResult {
    const arrangements = generateValidArrangements(cards);

    if (arrangements.length === 0) {
      throw new Error('No valid arrangements possible (foul inevitable)');
    }

    // Evaluate all arrangements
    const results = arrangements.map(arr => ({
      arrangement: arr,
      expectedValue: useMonteCarlo && this.mcSimulator
        ? this.mcSimulator.simulate(arr, cards, 3, mcIterations).averageScore
        : this.evCalculator.calculateEV(arr, cards, 3)
    }));

    // Sort by EV
    results.sort((a, b) => b.expectedValue - a.expectedValue);

    const optimal = results[0];
    const alternatives = results.slice(1, 6).map(r => ({
      ...r,
      evDiff: optimal.expectedValue - r.expectedValue
    }));

    return {
      arrangement: optimal.arrangement,
      expectedValue: optimal.expectedValue,
      alternatives
    };
  }
}
```

#### 5.5 Post-Game Analysis
**File**: `src/chinese-poker/solver/analyzer.ts`

```typescript
export interface AnalysisReport {
  playerArrangement: Arrangement;
  optimalArrangement: Arrangement;

  // Foul check
  isFoul: boolean;
  foulReasons: string[];

  // EV comparison
  playerEV: number;
  optimalEV: number;
  evLoss: number;  // How much EV was left on the table

  // Line-by-line breakdown
  lines: {
    front: LineAnalysis;
    middle: LineAnalysis;
    back: LineAnalysis;
  };

  // Missed opportunities
  missedOpportunities: string[];

  // Strategic feedback
  strategicInsights: string[];
}

export interface LineAnalysis {
  hand: Card[];
  handValue: HandValue;
  winProbability: number;
  optimalHand?: Card[];
  optimalWinProbability?: number;

  // What went wrong/right
  assessment: 'optimal' | 'suboptimal' | 'mistake';
  explanation: string;
}

export class PostGameAnalyzer {
  constructor(
    private optimizer: ArrangementOptimizer,
    private evaluator: HandEvaluator,
    private evCalculator: EVCalculator
  ) {}

  analyze(
    cards: Card[],
    playerArrangement: Arrangement
  ): AnalysisReport {
    // 1. Foul check
    const validation = validateArrangement(
      playerArrangement.front,
      playerArrangement.middle,
      playerArrangement.back
    );

    // 2. Find optimal
    const optimal = this.optimizer.findOptimal(cards);

    // 3. Calculate EVs
    const playerEV = this.evCalculator.calculateEV(playerArrangement, cards);
    const optimalEV = optimal.expectedValue;

    // 4. Line-by-line analysis
    const lines = this.analyzeLines(
      playerArrangement,
      optimal.arrangement,
      cards
    );

    // 5. Identify missed opportunities
    const missedOpportunities = this.findMissedOpportunities(
      playerArrangement,
      optimal.arrangement,
      cards
    );

    // 6. Strategic insights
    const strategicInsights = this.generateInsights(
      playerArrangement,
      optimal.arrangement,
      lines
    );

    return {
      playerArrangement,
      optimalArrangement: optimal.arrangement,
      isFoul: !validation.isValid,
      foulReasons: validation.violations.map(v => v.message),
      playerEV,
      optimalEV,
      evLoss: optimalEV - playerEV,
      lines,
      missedOpportunities,
      strategicInsights
    };
  }

  private analyzeLines(
    playerArr: Arrangement,
    optimalArr: Arrangement,
    cards: Card[]
  ): AnalysisReport['lines'] {
    return {
      front: this.analyzeLine(
        playerArr.front,
        optimalArr.front,
        'front',
        cards
      ),
      middle: this.analyzeLine(
        playerArr.middle,
        optimalArr.middle,
        'middle',
        cards
      ),
      back: this.analyzeLine(
        playerArr.back,
        optimalArr.back,
        'back',
        cards
      )
    };
  }

  private analyzeLine(
    playerHand: Card[],
    optimalHand: Card[],
    position: 'front' | 'middle' | 'back',
    allCards: Card[]
  ): LineAnalysis {
    const playerWinProb = this.evaluator.getWinProbability(
      playerHand,
      position,
      allCards
    );
    const optimalWinProb = this.evaluator.getWinProbability(
      optimalHand,
      position,
      allCards
    );

    const probDiff = Math.abs(playerWinProb - optimalWinProb);

    let assessment: LineAnalysis['assessment'];
    let explanation: string;

    if (probDiff < 0.02) {
      assessment = 'optimal';
      explanation = `Excellent choice. This ${position} hand has a ${(playerWinProb * 100).toFixed(1)}% win rate.`;
    } else if (probDiff < 0.10) {
      assessment = 'suboptimal';
      explanation = `Decent choice, but could be improved. Win rate: ${(playerWinProb * 100).toFixed(1)}% vs optimal ${(optimalWinProb * 100).toFixed(1)}%.`;
    } else {
      assessment = 'mistake';
      explanation = `Significant mistake. You gave up ${(probDiff * 100).toFixed(1)}% win probability on this line.`;
    }

    return {
      hand: playerHand,
      handValue: position === 'front'
        ? evaluateThreeCardHand(playerHand)
        : evaluateFiveCardHand(playerHand),
      winProbability: playerWinProb,
      optimalHand,
      optimalWinProbability: optimalWinProb,
      assessment,
      explanation
    };
  }

  private findMissedOpportunities(
    playerArr: Arrangement,
    optimalArr: Arrangement,
    cards: Card[]
  ): string[] {
    const opportunities: string[] = [];

    // Check if player missed a special hand
    const specialHand = detectSpecialHand(cards, this.evCalculator.scoringRules);
    if (specialHand.type !== SpecialHandType.NONE) {
      opportunities.push(
        `Missed special hand: ${specialHand.type} worth ${specialHand.points} points`
      );
    }

    // Check if player could have "jammed the front"
    const optimalFrontVal = evaluateThreeCardHand(optimalArr.front);
    const playerFrontVal = evaluateThreeCardHand(playerArr.front);

    if (optimalFrontVal.rank === ThreeCardRank.PAIR &&
        playerFrontVal.rank === ThreeCardRank.HIGH_CARD) {
      opportunities.push(
        'Could have made a pair in front by sacrificing back/middle strength'
      );
    }

    // Check if player over-invested in back
    const optimalBackVal = evaluateFiveCardHand(optimalArr.back);
    const playerBackVal = evaluateFiveCardHand(playerArr.back);

    if (playerBackVal.rank > optimalBackVal.rank) {
      opportunities.push(
        'Over-invested in back hand. Could have transferred strength to middle/front.'
      );
    }

    return opportunities;
  }

  private generateInsights(
    playerArr: Arrangement,
    optimalArr: Arrangement,
    lines: AnalysisReport['lines']
  ): string[] {
    const insights: string[] = [];

    // Pattern: Weak front
    if (lines.front.assessment === 'mistake') {
      insights.push(
        'Strategy tip: Front hand is often the decisive battleground. Consider "jamming the front" with high cards when back/middle are secure.'
      );
    }

    // Pattern: Over-strong back
    if (lines.back.winProbability > 0.95 && lines.front.winProbability < 0.5) {
      insights.push(
        'Balance issue: Your back is very strong (>95% win rate) but front is weak. Consider transferring resources.'
      );
    }

    // Pattern: Middle weak
    if (lines.middle.assessment === 'mistake') {
      insights.push(
        'Middle hand strategy: This line is doubly constrained (back >= middle >= front). Look for opportunities to claim royalty bonuses (Full House = +12).'
      );
    }

    return insights;
  }
}
```

### Phase 6: Game State Management

#### 6.1 Game State Types
**File**: `src/types/chinese-poker.ts`

```typescript
import { Card } from './index';

export interface ChinesePokerGameState {
  gameId: string;
  players: Player[];
  currentPhase: GamePhase;
  scoringRules: ScoringRules;
  dealSeed: string;  // For deterministic replay

  // Round state
  roundNumber: number;
  hands: Map<string, Card[]>;  // playerId -> 13 cards
  arrangements: Map<string, Arrangement | null>;  // playerId -> arrangement

  // Results
  roundResults?: RoundResults;
  gameResults?: GameResults;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export enum GamePhase {
  SETUP = 'SETUP',
  DEALING = 'DEALING',
  ARRANGING = 'ARRANGING',
  SCORING = 'SCORING',
  REVIEW = 'REVIEW',
  FINISHED = 'FINISHED'
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  isAI: boolean;
}

export interface Arrangement {
  front: Card[];   // 3 cards
  middle: Card[];  // 5 cards
  back: Card[];    // 5 cards
}

export interface RoundResults {
  roundNumber: number;
  scores: Map<string, number>;  // playerId -> round score
  lineResults: Map<string, LineResults>;
  analyses?: Map<string, AnalysisReport>;  // For human players
}

export interface LineResults {
  frontWins: number;
  middleWins: number;
  backWins: number;
  scoops: number;
  scoopedBy: number;
}

export interface GameResults {
  finalScores: Map<string, number>;
  winner: string;
  roundCount: number;
}
```

#### 6.2 Single-Player Practice Engine
**File**: `src/lib/game/chinese-poker/engine.ts`

```typescript
export class ChinesePokerEngine {
  private state: ChinesePokerGameState;
  private optimizer: ArrangementOptimizer;
  private analyzer: PostGameAnalyzer;

  constructor(
    scoringRules: ScoringRules,
    numAIOpponents: number = 3
  ) {
    this.state = this.initializeGame(scoringRules, numAIOpponents);
    this.optimizer = new ArrangementOptimizer(/* ... */);
    this.analyzer = new PostGameAnalyzer(/* ... */);
  }

  // State transitions
  startRound(): void {
    this.state.currentPhase = GamePhase.DEALING;
    this.dealCards();
    this.state.currentPhase = GamePhase.ARRANGING;
  }

  submitPlayerArrangement(playerId: string, arrangement: Arrangement): void {
    if (this.state.currentPhase !== GamePhase.ARRANGING) {
      throw new Error('Not in arranging phase');
    }

    // No validation here! Allow player to submit anything
    this.state.arrangements.set(playerId, arrangement);

    // Auto-arrange for AI opponents
    this.arrangeAIOpponents();

    // All arrangements submitted
    if (this.allArrangementsSubmitted()) {
      this.state.currentPhase = GamePhase.SCORING;
      this.scoreRound();
      this.state.currentPhase = GamePhase.REVIEW;
    }
  }

  getPostGameAnalysis(playerId: string): AnalysisReport {
    const playerCards = this.state.hands.get(playerId)!;
    const playerArrangement = this.state.arrangements.get(playerId)!;

    return this.analyzer.analyze(playerCards, playerArrangement);
  }

  // Internal methods
  private dealCards(): void {
    const numPlayers = this.state.players.length;
    const dealt = dealChinesePoker(numPlayers, this.state.dealSeed);

    dealt.forEach((hand, idx) => {
      const playerId = this.state.players[idx].id;
      this.state.hands.set(playerId, hand.cards);
    });
  }

  private arrangeAIOpponents(): void {
    this.state.players
      .filter(p => p.isAI)
      .forEach(aiPlayer => {
        const cards = this.state.hands.get(aiPlayer.id)!;
        const optimal = this.optimizer.findOptimal(cards);
        this.state.arrangements.set(aiPlayer.id, optimal.arrangement);
      });
  }

  private scoreRound(): void {
    const arrangements = Array.from(this.state.arrangements.entries());
    const scores = scoreMultiPlayer(
      arrangements.map(([_, arr]) => arr!),
      this.state.scoringRules
    );

    const roundResults: RoundResults = {
      roundNumber: this.state.roundNumber,
      scores: new Map(),
      lineResults: new Map(),
      analyses: new Map()
    };

    arrangements.forEach(([playerId, _], idx) => {
      const score = scores[idx];
      roundResults.scores.set(playerId, score);

      // Update total
      const player = this.state.players.find(p => p.id === playerId)!;
      player.totalScore += score;
    });

    this.state.roundResults = roundResults;
  }

  // Getters
  getState(): ChinesePokerGameState {
    return this.state;
  }

  getPlayerHand(playerId: string): Card[] {
    return this.state.hands.get(playerId) ?? [];
  }
}
```

### Phase 7: Multiplayer Foundation (API Structure Only)

#### 7.1 Room State Schema (Redis)
**File**: `src/lib/redis/chinese-poker-room.ts`

```typescript
export interface ChinesePokerRoomState {
  roomId: string;
  gameState: ChinesePokerGameState;

  // Multiplayer-specific
  hostPlayerId: string;
  joinedPlayers: string[];
  maxPlayers: number;
  isPublic: boolean;

  // Timing
  arrangeTimeLimit?: number;  // seconds
  roundStartedAt?: number;
}

export class ChinesePokerRoomManager {
  constructor(private redis: Redis) {}

  async createRoom(
    hostPlayerId: string,
    options: CreateRoomOptions
  ): Promise<string> {
    const roomId = generateRoomId();
    const roomState: ChinesePokerRoomState = {
      roomId,
      gameState: /* initialize game state */,
      hostPlayerId,
      joinedPlayers: [hostPlayerId],
      maxPlayers: options.maxPlayers ?? 4,
      isPublic: options.isPublic ?? false
    };

    await this.redis.set(
      `chinese-poker:room:${roomId}`,
      JSON.stringify(roomState),
      'EX',
      3600 * 4  // 4 hour expiry
    );

    return roomId;
  }

  async joinRoom(roomId: string, playerId: string): Promise<void> {
    // Implement join logic
  }

  async submitArrangement(
    roomId: string,
    playerId: string,
    arrangement: Arrangement
  ): Promise<void> {
    // Implement arrangement submission
  }

  async getRoomState(roomId: string): Promise<ChinesePokerRoomState | null> {
    const data = await this.redis.get(`chinese-poker:room:${roomId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

#### 7.2 API Route Definitions
**File**: `src/app/api/chinese-poker/rooms/create/route.ts`

```typescript
export async function POST(request: Request) {
  const { hostPlayerId, scoringRules, maxPlayers, isPublic } = await request.json();

  const roomManager = new ChinesePokerRoomManager(redis);
  const roomId = await roomManager.createRoom(hostPlayerId, {
    scoringRules,
    maxPlayers,
    isPublic
  });

  return Response.json({ roomId });
}
```

Similar routes:
- `POST /api/chinese-poker/rooms/:roomId/join`
- `POST /api/chinese-poker/rooms/:roomId/start`
- `POST /api/chinese-poker/rooms/:roomId/arrange`
- `GET /api/chinese-poker/rooms/:roomId/state`
- `GET /api/chinese-poker/rooms/:roomId/analysis`

#### 7.3 Real-time Event Types (Ably)
**File**: `src/lib/realtime/chinese-poker-events.ts`

```typescript
export enum ChinesePokerEvent {
  PLAYER_JOINED = 'player-joined',
  ROUND_STARTED = 'round-started',
  ARRANGEMENT_SUBMITTED = 'arrangement-submitted',
  ROUND_SCORED = 'round-scored',
  GAME_FINISHED = 'game-finished'
}

export interface PlayerJoinedEvent {
  playerId: string;
  playerName: string;
}

export interface RoundStartedEvent {
  roundNumber: number;
  hands: Map<string, Card[]>;  // Only send to respective players
}

export interface ArrangementSubmittedEvent {
  playerId: string;
  // Don't reveal actual arrangement until all submitted
}

export interface RoundScoredEvent {
  roundResults: RoundResults;
}
```

### Phase 8: Testing

#### 8.1 Hand Evaluation Tests
**File**: `src/utils/chinese-poker/__tests__/hand-evaluation.test.ts`

```typescript
describe('Three-Card Hand Evaluation', () => {
  test('trips beats pair', () => {
    const trips = evaluateThreeCardHand([
      { rank: Rank.TWO, suit: Suit.HEARTS },
      { rank: Rank.TWO, suit: Suit.DIAMONDS },
      { rank: Rank.TWO, suit: Suit.CLUBS }
    ]);

    const pair = evaluateThreeCardHand([
      { rank: Rank.ACE, suit: Suit.HEARTS },
      { rank: Rank.ACE, suit: Suit.DIAMONDS },
      { rank: Rank.KING, suit: Suit.CLUBS }
    ]);

    expect(compareThreeCardHands(trips, pair)).toBe(1);
  });

  test('higher pair beats lower pair', () => {
    const aces = evaluateThreeCardHand([/* A-A-7 */]);
    const kings = evaluateThreeCardHand([/* K-K-7 */]);

    expect(compareThreeCardHands(aces, kings)).toBe(1);
  });

  test('kicker matters when pairs equal', () => {
    const aa7 = evaluateThreeCardHand([/* A-A-7 */]);
    const aa5 = evaluateThreeCardHand([/* A-A-5 */]);

    expect(compareThreeCardHands(aa7, aa5)).toBe(1);
  });
});

describe('Five-Card Hand Evaluation', () => {
  test('royal flush beats straight flush', () => {
    // Test cases
  });

  test('full house comparison', () => {
    // A-A-A-K-K vs K-K-K-A-A
  });

  test('flush comparison by high cards', () => {
    // A♠ K♠ 7♠ 5♠ 2♠ vs K♥ Q♥ J♥ 10♥ 9♥
  });
});
```

#### 8.2 Arrangement Validation Tests
**File**: `src/utils/chinese-poker/__tests__/validation.test.ts`

```typescript
describe('Arrangement Validation', () => {
  test('valid arrangement passes', () => {
    const valid: Arrangement = {
      front: [/* 7-7-2 */],
      middle: [/* 9-9-5-4-3 */],
      back: [/* A-A-K-K-Q */]
    };

    const result = validateArrangement(valid.front, valid.middle, valid.back);
    expect(result.isValid).toBe(true);
  });

  test('middle stronger than back is foul', () => {
    const foul: Arrangement = {
      front: [/* 7-7-2 */],
      middle: [/* A-A-A-K-K */],  // Full house
      back: [/* 9-9-5-4-3 */]     // Two pair
    };

    const result = validateArrangement(foul.front, foul.middle, foul.back);
    expect(result.isValid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.objectContaining({ type: 'MIDDLE_STRONGER_THAN_BACK' })
    );
  });

  test('front stronger than middle is foul', () => {
    // Test case
  });
});
```

#### 8.3 Scoring Tests
**File**: `src/utils/chinese-poker/__tests__/scoring.test.ts`

```typescript
describe('Scoring System', () => {
  test('1-1-1 rule: basic scoring', () => {
    const p1: Arrangement = { /* wins all 3 lines */ };
    const p2: Arrangement = { /* loses all 3 lines */ };

    const result = scoreHeadToHead(p1, p2, RULES_1_1_1);
    expect(result.playerScores[0]).toBe(3);
    expect(result.playerScores[1]).toBe(-3);
  });

  test('2-4 rule: scoop bonus', () => {
    const p1: Arrangement = { /* wins all 3 */ };
    const p2: Arrangement = { /* loses all 3 */ };

    const result = scoreHeadToHead(p1, p2, RULES_2_4);
    expect(result.playerScores[0]).toBe(4);  // Scoop bonus
  });

  test('1-6 rule: win 2 lines gets 1 point', () => {
    const p1: Arrangement = { /* wins front and middle */ };
    const p2: Arrangement = { /* wins back */ };

    const result = scoreHeadToHead(p1, p2, RULES_1_6);
    expect(result.playerScores[0]).toBe(1);
  });

  test('foul results in penalty', () => {
    const p1Foul: Arrangement = { /* invalid arrangement */ };
    const p2Valid: Arrangement = { /* valid */ };

    const result = scoreHeadToHead(p1Foul, p2Valid, RULES_1_1_1);
    expect(result.playerScores[0]).toBe(-3);  // Foul penalty
  });
});
```

#### 8.4 Special Hands Tests
**File**: `src/utils/chinese-poker/__tests__/special-hands.test.ts`

```typescript
describe('Special Hands Detection', () => {
  test('detects Dragon', () => {
    const dragon = [
      /* A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K */
    ];

    const result = detectSpecialHand(dragon, DEFAULT_RULES);
    expect(result.type).toBe(SpecialHandType.DRAGON);
    expect(result.points).toBe(13);
  });

  test('detects Six Pairs', () => {
    const sixPairs = [
      /* A-A, K-K, Q-Q, J-J, 10-10, 9-9, 8 */
    ];

    const result = detectSpecialHand(sixPairs, DEFAULT_RULES);
    expect(result.type).toBe(SpecialHandType.SIX_PAIRS);
  });

  test('detects Three Flushes', () => {
    // Test case
  });
});
```

#### 8.5 Strategy Tests
**File**: `src/chinese-poker/solver/__tests__/optimizer.test.ts`

```typescript
describe('Arrangement Optimizer', () => {
  test('finds optimal arrangement for strong hand', () => {
    const cards = [
      /* Very strong hand with clear optimal arrangement */
    ];

    const result = optimizer.findOptimal(cards);
    expect(result.arrangement).toBeDefined();
    expect(result.expectedValue).toBeGreaterThan(0);
  });

  test('chooses special hand when EV higher', () => {
    const dragon = [/* Dragon hand */];

    const result = optimizer.findOptimal(dragon);
    expect(result.arrangement).toEqual(/* Dragon arrangement */);
  });

  test('avoids foul even with weak hand', () => {
    const weakHand = [/* Very weak, hard to arrange */];

    const result = optimizer.findOptimal(weakHand);
    const validation = validateArrangement(
      result.arrangement.front,
      result.arrangement.middle,
      result.arrangement.back
    );

    expect(validation.isValid).toBe(true);
  });
});
```

---

## Part 6: File Structure Summary

```
src/
├── types/
│   └── chinese-poker.ts                 # All TypeScript interfaces
│
├── utils/chinese-poker/
│   ├── hand-3card.ts                    # 3-card hand evaluation
│   ├── hand-5card.ts                    # 5-card hand evaluation (extends poker solver)
│   ├── comparison.ts                    # Hand comparison logic
│   ├── deck.ts                          # Card dealing & deck management
│   ├── validation.ts                    # Arrangement validation & foul detection
│   ├── generator.ts                     # Valid arrangement generator with pruning
│   │
│   ├── scoring/
│   │   ├── special-hands.ts            # Naturals detection (Dragon, Six Pairs, etc.)
│   │   ├── basic-scoring.ts            # 1-1-1, 2-4, 1-6 scoring rules
│   │   └── royalty.ts                  # Bonus point calculations
│   │
│   └── __tests__/
│       ├── hand-evaluation.test.ts
│       ├── validation.test.ts
│       ├── scoring.test.ts
│       └── special-hands.test.ts
│
├── chinese-poker/solver/
│   ├── evaluator.ts                     # Win probability calculator (LUT-based)
│   ├── monte-carlo.ts                   # Monte Carlo simulator
│   ├── ev-calculator.ts                 # Expected Value computation
│   ├── optimizer.ts                     # Optimal arrangement finder
│   ├── analyzer.ts                      # Post-game analysis
│   │
│   └── __tests__/
│       ├── optimizer.test.ts
│       └── analyzer.test.ts
│
├── lib/game/chinese-poker/
│   ├── engine.ts                        # Single-player game engine
│   └── multiplayer-engine.ts           # (Future) Multiplayer game engine
│
├── lib/redis/
│   └── chinese-poker-room.ts           # Room state management (Redis)
│
├── lib/realtime/
│   └── chinese-poker-events.ts         # Ably event types
│
└── app/api/chinese-poker/
    ├── rooms/
    │   ├── create/route.ts
    │   └── [roomId]/
    │       ├── join/route.ts
    │       ├── start/route.ts
    │       ├── arrange/route.ts
    │       ├── state/route.ts
    │       └── analysis/route.ts

scripts/
└── generate-win-rate-tables.ts         # Pre-computation script (run offline)
```

---

## Part 7: Implementation Timeline

**Estimated Timeline**: 4-6 weeks (backend only, no frontend)

### Week 1: Foundation
- [ ] Phase 2.1-2.3: Hand evaluation (3-card, 5-card, comparison)
- [ ] Phase 3.1: Card dealing and deck management
- [ ] Unit tests for hand evaluation

### Week 2: Core Logic
- [ ] Phase 3.2-3.4: Validation, foul detection, arrangement generator
- [ ] Phase 4.1: Special hands detection
- [ ] Integration tests for validation

### Week 3: Scoring & Strategy
- [ ] Phase 4.2-4.4: Basic scoring, scoop, royalty
- [ ] Phase 5.1-5.2: Win probability calculator, Monte Carlo
- [ ] Scoring system tests

### Week 4: Strategy Engine
- [ ] Phase 5.3-5.4: EV calculator, optimizer
- [ ] Phase 5.5: Post-game analyzer
- [ ] Strategy validation tests

### Week 5: Game State
- [ ] Phase 6.1-6.2: Game state types, single-player engine
- [ ] Phase 6.3-6.4: State transitions, replay support
- [ ] End-to-end game flow tests

### Week 6: Multiplayer Foundation + Polish
- [ ] Phase 7.1-7.3: Room management, API routes, event types
- [ ] Documentation
- [ ] Edge case testing
- [ ] Performance optimization

---

## Part 8: Future Extensions

### Frontend Implementation (Out of Scope for Backend)
- React components for card display and drag-and-drop arrangement
- Real-time game lobby
- Post-game review UI with visualizations
- Tutorial mode for beginners

### Advanced Features
- **AI Difficulty Levels**: Beginner (random), Intermediate (greedy), Advanced (Monte Carlo with limited iterations), Expert (full optimization)
- **Training Mode**: Show probability overlays while arranging (opt-in)
- **Replay System**: Save and replay historical games with analysis
- **Leaderboards**: Track player statistics and rankings
- **Tournament Mode**: Multi-round tournaments with elimination

### Performance Optimizations
- **Pre-compute Win Rate Tables**: Generate once, load at runtime (currently planned)
- **WebAssembly**: Port hand evaluation to WASM for 10-100x speedup
- **Parallel Processing**: Use Web Workers for Monte Carlo simulations
- **Caching**: Memoize arrangement evaluations within a session

---

## Appendix: References

1. **PDF Source**: 十三张最优策略计算机求解.pdf
2. **Existing Codebase Patterns**:
   - Poker solver: `src/poker/solver/`
   - Multiplayer engine: `src/lib/game/multiplayer-engine.ts`
   - Hand evaluation: `src/utils/hand.ts`
3. **External Libraries**:
   - OMPEval / PokerStove: 5-card hand evaluation
   - Redis: Room state storage
   - Ably: Real-time messaging

---

## Contact & Next Steps

**Status**: ✅ Phase 1 Complete (Research & Architecture)

**Ready to Start**: Phase 2 (Hand Evaluation Engine)

For questions or clarifications, refer to:
- [task_plan.md](task_plan.md) - Detailed phase tracking
- [notes.md](notes.md) - Research findings and design decisions
