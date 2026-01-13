# Task Plan: Chinese Poker (十三水) Backend Implementation

## Goal
Implement a complete backend system for Chinese Poker that handles 13-card hand arrangement, validation, scoring, and post-game analysis with support for future multiplayer extension.

## Phases
- [x] Phase 1: Research and architecture design (analyze PDF, design data structures)
- [ ] Phase 2: Core poker hand evaluation engine
  - [ ] 2.1: 3-card hand evaluator (High Card, Pair, Trips)
  - [ ] 2.2: 5-card hand evaluator (reuse/extend existing poker solver)
  - [ ] 2.3: Hand comparison logic (3-card vs 3-card, 5-card vs 5-card)
- [ ] Phase 3: Chinese Poker specific logic
  - [ ] 3.1: Card dealing and deck management
  - [ ] 3.2: Arrangement validation (Back ≥ Middle ≥ Front constraint)
  - [ ] 3.3: Foul detection
  - [ ] 3.4: Valid arrangement generator (with pruning)
- [ ] Phase 4: Scoring system
  - [ ] 4.1: Special hands detection (Dragon, Six Pairs, Three Flushes, Three Straights)
  - [ ] 4.2: Basic scoring (1-1-1, 2-4, 1-6 rules)
  - [ ] 4.3: Scoop calculation
  - [ ] 4.4: Royalty/bonus system
- [ ] Phase 5: Optimal strategy and analysis
  - [ ] 5.1: Win probability calculator (Look-Up Tables)
  - [ ] 5.2: Monte Carlo simulator
  - [ ] 5.3: Expected Value (EV) calculator
  - [ ] 5.4: Optimal arrangement finder
  - [ ] 5.5: Post-game analysis (missed opportunities, EV comparison)
- [ ] Phase 6: Game state management
  - [ ] 6.1: Game state types and interfaces
  - [ ] 6.2: Single-player practice engine
  - [ ] 6.3: State transitions (dealing → arranging → scoring → review)
  - [ ] 6.4: Deterministic replay support
- [ ] Phase 7: Multiplayer foundation (API structure only)
  - [ ] 7.1: Room state schema (Redis)
  - [ ] 7.2: API route definitions
  - [ ] 7.3: Real-time event types (Ably)
- [ ] Phase 8: Testing
  - [ ] 8.1: Unit tests for hand evaluation
  - [ ] 8.2: Integration tests for scoring
  - [ ] 8.3: Strategy validation tests
  - [ ] 8.4: Edge case coverage (fouls, special hands)

## Key Questions - ANSWERED
1. ✅ What hand ranking system does the PDF recommend for optimal strategy?
   - **Answer**: Standard poker rankings. Use percentile-based strength (e.g., A-high flush = 80% in back)

2. ✅ What special hands (Dragon, Six Pairs, etc.) should be supported?
   - **Answer**: Dragon (一条龙, 13/26 pts), Six Pairs (六对半, 3 pts), Three Flushes (3 pts), Three Straights (3 pts)

3. ✅ How should we calculate "optimal arrangement" for post-game analysis?
   - **Answer**: Monte Carlo simulation (10K+ iterations) + EV maximization. Compare player arrangement EV vs optimal EV.

4. ✅ What scoring system variants exist?
   - **Answer**: 1-1-1 (basic), 2-4 (American/HK), 1-6 (with Grand Slam). Should support all three.

5. ✅ How should the backend integrate with existing multiplayer infrastructure?
   - **Answer**: Follow `MultiplayerGameEngine` pattern, use existing Redis/Ably. Room-based, per-line comparison.

## Decisions Made
- **Language**: TypeScript (consistency with existing codebase)
- **Hand Evaluation**: Extend existing poker solver in `src/poker/solver/` for 5-card hands
- **3-Card Evaluation**: New custom evaluator (simpler than 5-card)
- **Bit Manipulation**: Use existing card representation patterns from poker solver
- **Scoring Rules**: Start with 1-1-1 (simplest), then add 2-4 and 1-6 as configurable variants
- **Special Hands**: Implement detection, make rewards configurable
- **Strategy Engine**: Monte Carlo based (10,000 simulations per arrangement)
- **State Management**: Class-based engine similar to `MultiplayerGameEngine`
- **Directory Structure**:
  ```
  src/
  ├── utils/chinese-poker/         # Core logic
  │   ├── hand.ts                  # 3-card & 5-card evaluation
  │   ├── comparison.ts            # Hand comparison
  │   ├── validation.ts            # Constraint & foul detection
  │   ├── generator.ts             # Valid arrangement generator
  │   └── scoring/
  │       ├── special-hands.ts     # Naturals detection
  │       ├── basic-scoring.ts     # 1-1-1, 2-4, 1-6
  │       └── royalty.ts           # Bonus calculations
  ├── chinese-poker/solver/        # Strategy engine
  │   ├── evaluator.ts             # Win probability (LUT-based)
  │   ├── monte-carlo.ts           # MC simulation
  │   ├── ev-calculator.ts         # EV computation
  │   └── analyzer.ts              # Post-game analysis
  ├── lib/game/chinese-poker/      # Game state
  │   └── engine.ts                # Game engine class
  └── types/chinese-poker.ts       # TypeScript types
  ```

## Errors Encountered
- None yet

## Status
**Phase 1 Complete** ✅ - PDF analyzed, architecture designed, comprehensive implementation plan created

**Next Step**: Ready to begin Phase 2 (Core Poker Hand Evaluation Engine)

**Deliverable**: [CHINESE_POKER_IMPLEMENTATION_PLAN.md](CHINESE_POKER_IMPLEMENTATION_PLAN.md) - 200+ page comprehensive implementation guide

## Notes
- Must maintain compatibility with existing codebase patterns (hooks, game engines)
- Should follow separation of concerns: hand evaluation, game rules, state management
- Need to support both single-player practice and future multiplayer
