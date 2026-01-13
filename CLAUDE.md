# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 (App Router) application combining two card game trainers:
1. **Blackjack Trainer** - Teaches card counting (Hi-Lo system) and basic strategy
2. **GTO Poker Solver** - Texas Hold'em GTO strategy trainer with CFR-based solver

The app is a Progressive Web App (PWA) with offline support, built with React 19, TypeScript, and Tailwind CSS 4.

## Development Commands

```bash
# Development
bun run dev              # Start dev server at http://localhost:3000

# Build & Deploy
bun run build           # Production build
bun start               # Start production server

# Testing
bun test                # Run all tests
bun run test:watch      # Watch mode
bun run test:coverage   # With coverage report

# Linting
bun run lint            # Run ESLint
```

### Test Patterns
- Test files: `**/__tests__/**/*.test.ts(x)` or `**/*.test.ts(x)`
- Coverage threshold: 70% (branches, functions, lines, statements)
- Run single test: `bun test -- <test-file-path>`

## Architecture

### App Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── blackjack/         # Blackjack game (free/training modes)
│   ├── poker/             # Poker GTO trainer modules
│   │   ├── builder/       # Custom GTO scenario builder
│   │   ├── heatmap/       # Range visualization
│   │   ├── training/      # Preflop training
│   │   ├── scenarios/     # Curated scenarios
│   │   └── stats/         # Progress tracking
│   └── api/               # API routes (multiplayer backend)
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Backend logic (Redis, Ably, game engine)
├── poker/                 # Poker solver & GTO data
│   ├── solver/           # CFR solver implementation
│   └── data/             # Preflop range data
├── types/                # TypeScript type definitions
└── utils/                # Game logic utilities (deck, hand, strategy)
```

### Key Architecture Patterns

**1. Game State Management**
- Blackjack uses `useGame` hook ([src/hooks/useGame.ts](src/hooks/useGame.ts)) for single-player state
- Multiplayer uses `MultiplayerGameEngine` class ([src/lib/game/multiplayer-engine.ts](src/lib/game/multiplayer-engine.ts))
- State transitions: `betting → playerTurn → dealerTurn → settlement`

**2. Strategy Engine**
- Basic strategy: `src/utils/strategy.ts` - chart-based recommendations
- Card counting: Hi-Lo system integrated in `useGame` (running count, true count)
- Poker GTO: CFR solver in `src/poker/solver/` with preflop range data

**3. Multiplayer Backend** (Partially Implemented)
- **Redis (Upstash)**: Room state storage via `RoomManager` ([src/lib/redis/client.ts](src/lib/redis/client.ts))
- **Ably**: Real-time messaging ([src/lib/realtime/ably-client.ts](src/lib/realtime/ably-client.ts))
- **API Routes**: REST endpoints in `src/app/api/`
- **Status**: Backend complete, frontend hooks/UI pending (see IMPLEMENTATION_STATUS.md)

**4. PWA Configuration**
- Uses `@ducanh2912/next-pwa` (configured in [next.config.ts](next.config.ts:11-15))
- Disabled in development, enabled in production
- Service worker generates at build time

### Important Configuration

**React Compiler**
- Currently enabled: `reactCompiler: true` in [next.config.ts](next.config.ts:6)
- Known issue: May conflict with `useI18n.ts` if i18n is expanded
- If build fails with parse errors, try disabling: `reactCompiler: false`

**External Packages**
- Ably must be externalized: `serverExternalPackages: ['ably']` (prevents Next.js bundling issues)

**Path Aliases**
- `@/*` maps to `src/*` (configured in [tsconfig.json](tsconfig.json:21-23))

## Multiplayer Implementation Status

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md) for details.

**Completed:**
- Backend: Redis client, Ably integration, game engine
- API routes: create, join, get room, auth, start game
- Types & utilities

**Pending:**
- API routes: bet, action, end, history
- Frontend hooks: `useMultiplayerRoom`, `useMultiplayerGame`, `useRealtime`
- UI components: lobby, game table, review

**Testing:**
```bash
node test-api.mjs    # Test multiplayer API (requires dev server running)
```

## Game Logic Patterns

### Blackjack Hand Evaluation
- `createHand()` ([src/utils/hand.ts](src/utils/hand.ts)) - Calculates totals, detects pairs/soft hands/blackjack
- Automatic soft hand conversion (A,7 = 18 soft → bust on 5 → 12 hard)
- Shoe management with 25% penetration reshuffle

### Card Counting
- Hi-Lo values: 2-6 = +1, 7-9 = 0, 10-A = -1
- Running count updated on every card dealt
- True count = running count / remaining decks
- Integrated into `useGame` hook state

### Poker Solver
- **CFR (Counterfactual Regret Minimization)** solver for GTO strategy
- Preflop ranges stored in `src/poker/data/strategies.ts`
- Hand evaluator uses 7-card lookup tables
- Suit isomorphism optimization for board texture equivalence

## Code Style Notes

From [.claude/CLAUDE.md](~/.claude/CLAUDE.md):
- No compatibility code unless explicitly requested
- Use English comments sparingly, only for complex logic
- Avoid over-commenting; prefer self-documenting code

## Environment Variables

Create `.env.local`:
```bash
# Multiplayer (optional)
ABLY_API_KEY=                    # For real-time messaging
UPSTASH_REDIS_REST_URL=          # Redis database
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_ENABLE_MULTIPLAYER=true
```

## Known Issues

1. **React Compiler + useI18n**: May cause parse errors if i18n is expanded (set `reactCompiler: false` if needed)
2. **Multiplayer**: Frontend components not yet implemented
3. **Test Coverage**: Some multiplayer modules lack tests

## Testing Multiplayer

1. Set up Upstash Redis account: https://console.upstash.com/
2. Set up Ably account: https://ably.com/signup
3. Configure `.env.local` with credentials
4. Run `bun run dev`
5. Execute `node test-api.mjs` to verify API endpoints
