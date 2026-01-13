# Notes: Chinese Poker Backend Research

## Sources

### Source 1: 十三张最优策略计算机求解.pdf
- Location: Project directory
- Status: Pending analysis

### Source 2: Existing Codebase Patterns
- Path: src/utils/, src/hooks/, src/lib/
- Key patterns identified:
  - Hand evaluation: src/utils/hand.ts (Blackjack)
  - Game state hooks: src/hooks/useGame.ts
  - Multiplayer engine: src/lib/game/multiplayer-engine.ts
  - Poker solver: src/poker/solver/

## Synthesized Findings

### Architecture Patterns from Existing Code
- **Utilities Pattern**: Pure functions in src/utils/ for game logic
- **Hooks Pattern**: React hooks for single-player state management
- **Engine Pattern**: Class-based engines for multiplayer with deterministic state
- **Solver Pattern**: Separate solver directory for strategy computation

### Chinese Poker Requirements
- Hand evaluation must support 3-card and 5-card poker hands
- Comparison logic must work across different hand sizes
- Foul detection requires comparing strength across three lines
- Scoring involves per-line comparison between players
- Special hands may override normal scoring

## PDF Analysis - Key Findings

### Game Theory Characteristics
1. **Static Combinatorial Optimization** - Not like Texas Hold'em (incomplete information with betting rounds)
2. **Simultaneous Move Game** - All players arrange independently, then reveal
3. **Zero-Sum Game** - Nash Equilibrium exists
4. **Constraint**: Back ≥ Middle ≥ Front (violation = Foul/相公)

### Combinatorial Complexity
- **Deal Combinations**: C(52,13) = 635,013,559,600 (~635 billion possible starting hands)
- **Theoretical Arrangements**: C(13,3) × C(10,5) × C(5,5) = 72,072 ways
- **Valid Arrangements**: Typically 100-2,000 valid arrangements per hand (most violate constraints)

### Scoring System Impact on Strategy
**1-1-1 Rule (Basic)**
- Each line independent, maximize individual win rates
- EV = (Win Front - Lose Front) + (Win Middle - Lose Middle) + (Win Back - Lose Back)

**2-4 Rule (American/Hong Kong)**
- Win 2 lines: 2 points (not 1+1-1=1)
- Scoop (win all 3): 4 points (not 3)
- Strategy: High variance, aggressive pursuit of scoops

**1-6 Rule (with Grand Slam bonus)**
- Win 2 lines: 1 point
- Scoop: 6 points
- Grand Slam: Scoop all opponents, doubled score or extra bonus
- Strategy: Extremely aggressive, willing to risk individual lines for scoop probability

### Special Hands (Naturals)
- **Dragon (一条龙)**: A-K straight, wins 13-26 points instantly
- **Six Pairs (六对半)**: 6 pairs + 1 kicker, wins 3 points
- **Three Flushes (三同花)**: All three lines are flushes, wins 3 points
- **Three Straights (三顺子)**: All three lines are straights, wins 3 points
- **Strategy Note**: AI must check if normal arrangement EV > natural bonus

### Optimal Strategy Principles

**Back Hand (尾道) - Foundation**
- Ensures legality and avoids foul (-3 to each opponent = -9 total)
- Threshold theory: Flush is watershed (A-high flush ~80% win rate in 4-player)
- Full House: ~95%+ win rate
- **AI Insight**: Keep back "just strong enough", transfer excess resources to middle/front

**Middle Hand (中道) - Pivot**
- Doubly constrained: Must be < Back AND > Front
- Middle Full House often has bonus (+2 points in many rulesets)
- **Counter-intuitive**: Sometimes worth making middle weak (even high card) to preserve strong front, as long as back is strong enough to avoid foul

**Front Hand (头道) - Decisive Battleground**
- Only 3 cards: High Card, Pair, Three of a Kind
- Pair has 60%+ win rate, QQ or KK has ~90%
- **"Jamming the Front"**: Push all big cards to front when back/middle are solid
- **Last Line of Defense**: When back/middle are weak, preserve front to avoid scoop

### Algorithm Architecture (from PDF)

**Core Modules:**
1. **Hand Generator**: Enumerate all valid 3-5-5 arrangements
2. **Evaluator**: Calculate win probability vs random/specific opponent distributions
3. **Maximizer**: Combine scoring weights, compute total EV, select optimal

**Key Techniques:**
1. **Recursive Backtracking** with pruning (check legality at each layer)
2. **Look-Up Tables (LUT)**: Pre-compute percentile strength for all hand types
3. **Blocker Correction**: Adjust opponent hand probabilities based on cards you hold
4. **Monte Carlo Simulation**:
   - Fix your arrangement H = (F, M, B)
   - Deal random hands to opponents from remaining 39 cards
   - Simulate opponent strategies (greedy or table-based)
   - Repeat 10,000+ times, average score = true EV

**EV Formula:**
```
EV_total = Σ(P(Win_i) × W_i - P(Lose_i) × L_i) + EV_scoop + EV_royalty

P(Scoop) = P(Win_F ∩ Win_M ∩ Win_B)  // Joint probability, NOT independent
```

**Pruning Optimization:**
- At each recursion level, immediately check constraint violations
- Valid arrangements typically reduce from 72,072 to few hundred
- Modern C++ can complete in microseconds

### Win Rate Reference Data (4-player)

**Back Hand:**
- Royal Flush: 100%
- Quads: >99%
- Full House (A-A-A-K-K): 98%
- Small Full House (2-2-2-3-3): 90%
- Flush (A-high): 80%
- Flush (6-high): 55%
- Straight (A-high): 40%
- Two Pair: 20%
- Trips/One Pair: <5% (high foul risk)

**Front Hand:**
- Any Pair: 60%+
- QQ or KK: ~90%

### Advanced Insights

**Blocker Effects:**
- If you hold 4 Aces, opponent front AA probability = 0
- Holding 3 Kings makes opponent front KK very unlikely
- Your pair Q's value increases dramatically

**"Tian Ji Horse Racing" Trap:**
- Humans often sacrifice back to strengthen middle/front
- **AI Insight**: With scoop bonuses, balance is more important than polarization
- Giving up back loses scoop opportunity AND exposes you to being scooped

**Flush vs Straight Re-evaluation:**
- Small flush in back (9-high) has low value, often beaten
- Breaking flush to make middle straight often has higher marginal EV

## Design Decisions

### Technology Stack
- **Language**: TypeScript (consistency with existing codebase)
- **Performance Critical**: Consider WebAssembly for hand evaluation if needed
- **Data Structures**: Bit manipulation for card representation (existing poker solver uses this)
- **Testing**: Jest (already configured, 70% coverage threshold)

### Architecture Layers
1. **Core Engine** (`src/utils/chinese-poker/`)
   - Hand evaluation (3-card and 5-card)
   - Arrangement validation
   - Foul detection
   - Comparison logic

2. **Scoring System** (`src/utils/chinese-poker/scoring/`)
   - Pluggable scoring rules (1-1-1, 2-4, 1-6)
   - Special hands detection
   - Royalty/bonus calculation

3. **Solver/Strategy** (`src/chinese-poker/solver/`)
   - Optimal arrangement finder
   - Monte Carlo simulator
   - Expected value calculator
   - Post-game analysis

4. **Game State** (`src/lib/game/chinese-poker/`)
   - Single-player practice mode
   - Multiplayer engine (future)
   - Deterministic replay

5. **API Routes** (`src/app/api/chinese-poker/`)
   - Compatible with existing multiplayer infrastructure
   - Room management, hand dealing, scoring

### Integration Points
- Reuse existing poker hand evaluator from `src/poker/solver/`
- Follow `MultiplayerGameEngine` pattern from blackjack
- Use existing Redis/Ably infrastructure for multiplayer
- Follow PWA patterns for offline play
