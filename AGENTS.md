# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds the Next.js App Router pages and layouts.
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` contain shared UI, hooks, utilities, and types.
- `src/poker/` contains solver and trainer logic; related tests live in `src/poker/solver/__tests__/`.
- Test files are colocated under `__tests__` (example: `src/utils/__tests__/deck.test.ts`).
- Static assets live in `public/`; data files for ranges live in `preflopRanges/`.
- Build output and coverage are generated in `.next/` and `coverage/`.

## Build, Test, and Development Commands
- `bun run dev`: start the local dev server at `http://localhost:3000`.
- `bun run build`: create a production build.
- `bun run start`: run the production server from the build output.
- `bun run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `bun run test`: run Jest once in CI mode.
- `bun run test:watch`: run Jest in watch mode.
- `bun run test:coverage`: generate coverage in `coverage/`.

## Coding Style & Naming Conventions
- Use TypeScript/TSX; keep indentation at 2 spaces and follow existing file formatting.
- React components are `PascalCase`, hooks are `useCamelCase`, and utilities are `camelCase`.
- Place shared UI in `src/components/` and keep domain-specific logic inside `src/poker/` or `src/utils/`.
- Run `bun run lint` before opening a PR.

## Testing Guidelines
- Frameworks: Jest with `jest-environment-jsdom` and Testing Library.
- Name tests `*.test.ts` or `*.test.tsx` inside `__tests__`.
- Add or update tests for logic changes in `src/utils/` and solver logic in `src/poker/`.

## Commit & Pull Request Guidelines
- Commit messages follow a conventional format like `feat: add solver cache` or `refactor: simplify deal flow`.
- PRs should include a short description, testing results (`bun run test` or targeted tests), and screenshots for UI changes.
- Link related issues or scenarios when applicable (see `TEST_SCENARIOS.md`).

## Configuration Notes
- Runtime and build settings live in `next.config.ts`, `tsconfig.json`, and `jest.config.js`.
- Keep changes to config files scoped and explained in the PR description.


## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- ui-ux-pro-max: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 8 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. (file: /Users/hongxichen/Desktop/blackjack/.codex/skills/ui-ux-pro-max/SKILL.md)
- artifacts-builder: Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts. (file: /Users/hongxichen/.codex/skills/artifacts-builder/SKILL.md)
- csv-data-summarizer: Analyzes CSV files, generates summary stats, and plots quick visualizations using Python and pandas. (file: /Users/hongxichen/.codex/skills/csv-data-summarizer-claude-skill/SKILL.md)
- docx: Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks (file: /Users/hongxichen/.codex/skills/document-skills/docx/SKILL.md)
- file-organizer: Intelligently organizes your files and folders across your computer by understanding context, finding duplicates, suggesting better structures, and automating cleanup tasks. Reduces cognitive load and keeps your digital workspace tidy without manual effort. (file: /Users/hongxichen/.codex/skills/file-organizer/SKILL.md)
- frontend-design: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics. (file: /Users/hongxichen/.codex/skills/frontend_desigh/SKILL.md)
- git-pushing: Stage, commit, and push git changes with conventional commit messages. Use when user wants to commit and push changes, mentions pushing to remote, or asks to save and push their work. Also activates when user says "push changes", "commit and push", "push this", "push to github", or similar git workflow requests. (file: /Users/hongxichen/.codex/skills/git-pushing/SKILL.md)
- imagen: Generate images using Google Gemini's image generation capabilities. Use this skill when the user needs to create, generate, or produce images for any purpose including UI mockups, icons, illustrations, diagrams, concept art, placeholder images, or visual representations. (file: /Users/hongxichen/.codex/skills/imagen/SKILL.md)
- n8n-skills: n8n workflow automation knowledge base. Provides n8n node information, node functionality details, workflow patterns, and configuration examples. Covers triggers, data transformation, data input/output, AI integration, covering 10 nodes. Keywords: n8n, workflow, automation, node, trigger, webhook, http request, database, ai agent. (file: /Users/hongxichen/.codex/skills/n8n-skills-2/SKILL.md)
- pdf: Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF form or programmatically process, generate, or analyze PDF documents at scale. (file: /Users/hongxichen/.codex/skills/document-skills/pdf/SKILL.md)
- planning-with-files: Transforms workflow to use Manus-style persistent markdown files for planning, progress tracking, and knowledge storage. Use when starting complex tasks, multi-step projects, research tasks, or when the user mentions planning, organizing work, tracking progress, or wants structured output. (file: /Users/hongxichen/.codex/skills/planning-with-files/SKILL.md)
- postgres: Execute read-only SQL queries against multiple PostgreSQL databases. Use when: (1) querying PostgreSQL databases, (2) exploring database schemas/tables, (3) running SELECT queries for data analysis, (4) checking database contents. Supports multiple database connections with descriptions for intelligent auto-selection. Blocks all write operations (INSERT, UPDATE, DELETE, DROP, etc.) for safety. (file: /Users/hongxichen/.codex/skills/postgres/SKILL.md)
- pptx: Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (3) Working with layouts, (4) Adding comments or speaker notes, or any other presentation tasks (file: /Users/hongxichen/.codex/skills/document-skills/pptx/SKILL.md)
- review-implementing: Process and implement code review feedback systematically. Use when user provides reviewer comments, PR feedback, code review notes, or asks to implement suggestions from reviews. (file: /Users/hongxichen/.codex/skills/review-implementing/SKILL.md)
- software-architecture: Guide for quality focused software architecture. This skill should be used when users want to write code, design architecture, analyze code, in any case that relates to software development. (file: /Users/hongxichen/.codex/skills/software-architecture/SKILL.md)
- subagent-driven-development: Use when executing implementation plans with independent tasks in the current session or facing 3+ independent issues that can be investigated without shared state or dependencies - dispatches fresh subagent for each task with code review between tasks, enabling fast iteration with quality gates (file: /Users/hongxichen/.codex/skills/subagent-driven-development/SKILL.md)
- test-driven-development: Use when implementing any feature or bugfix, before writing implementation code (file: /Users/hongxichen/.codex/skills/test-driven-development/SKILL.md)
- test-fixing: Run tests and systematically fix all failing tests using smart error grouping. Use when user asks to fix failing tests, mentions test failures, runs test suite and failures occur, or requests to make tests pass. (file: /Users/hongxichen/.codex/skills/test-fixing/SKILL.md)
- webapp-testing: Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs. (file: /Users/hongxichen/.codex/skills/webapp-testing/SKILL.md)
- xlsx: Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work with spreadsheets (.xlsx, .xlsm, .csv, .tsv, etc) for: (1) Creating new spreadsheets with formulas and formatting, (2) Reading or analyzing data, (3) Modify existing spreadsheets while preserving formulas, (4) Data analysis and visualization in spreadsheets, or (5) Recalculating formulas (file: /Users/hongxichen/.codex/skills/document-skills/xlsx/SKILL.md)
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /Users/hongxichen/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /Users/hongxichen/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  3) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  4) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
