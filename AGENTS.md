# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds the Next.js App Router pages and layouts.
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` contain shared UI, hooks, utilities, and types.
- `src/poker/` contains solver and trainer logic; related tests live in `src/poker/solver/__tests__/`.
- Test files are colocated under `__tests__` (example: `src/utils/__tests__/deck.test.ts`).
- Static assets live in `public/`; data files for ranges live in `preflopRanges/`.
- Build output and coverage are generated in `.next/` and `coverage/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local dev server at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production server from the build output.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npm run test`: run Jest once in CI mode.
- `npm run test:watch`: run Jest in watch mode.
- `npm run test:coverage`: generate coverage in `coverage/`.

## Coding Style & Naming Conventions
- Use TypeScript/TSX; keep indentation at 2 spaces and follow existing file formatting.
- React components are `PascalCase`, hooks are `useCamelCase`, and utilities are `camelCase`.
- Place shared UI in `src/components/` and keep domain-specific logic inside `src/poker/` or `src/utils/`.
- Run `npm run lint` before opening a PR.

## Testing Guidelines
- Frameworks: Jest with `jest-environment-jsdom` and Testing Library.
- Name tests `*.test.ts` or `*.test.tsx` inside `__tests__`.
- Add or update tests for logic changes in `src/utils/` and solver logic in `src/poker/`.

## Commit & Pull Request Guidelines
- Commit messages follow a conventional format like `feat: add solver cache` or `refactor: simplify deal flow`.
- PRs should include a short description, testing results (`npm run test` or targeted tests), and screenshots for UI changes.
- Link related issues or scenarios when applicable (see `TEST_SCENARIOS.md`).

## Configuration Notes
- Runtime and build settings live in `next.config.ts`, `tsconfig.json`, and `jest.config.js`.
- Keep changes to config files scoped and explained in the PR description.
