# scrolloop

Framework-agnostic virtual & infinite scrolling. A platform-neutral **core** engine with thin **adapters** per framework. pnpm + turbo monorepo.

## Packages (`packages/*`)

| Package                                        | Role                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@scrolloop/core`                              | Source of truth. Virtualizer, strategies, plugins, `InfiniteSource`. Zero framework deps.                       |
| `@scrolloop/shared`                            | Shared infinite-loading state/utilities used by adapters.                                                       |
| `react` `preact` `vue` `svelte` `react-native` | Thin adapters. They bind core to a framework's reactivity/render — they do **not** reimplement scrolling logic. |

**Architecture rule:** logic lives in `core`. Adapters only translate. A behavior change belongs in `core` (or `shared`); adapters then expose it. Keep the public API (`VirtualList` / `InfiniteList` props) equivalent across adapters — after an API change, use the `adapter-parity-reviewer` subagent.

## Commands

- Test: `pnpm test` · single pkg: `pnpm --filter @scrolloop/react test`
- Typecheck: `pnpm typecheck` · Fast lint: `pnpm lint:fast` (oxlint) · Full lint: `pnpm lint`
- Build: `pnpm build` · Bundle size: `pnpm size` · Dead code: `pnpm knip`
- Full local gate: **`/check`** · Release flow: **`/release`**

Formatting & fast-lint run automatically on every file you edit (PostToolUse hook) — don't hand-run prettier.

## Conventions

- **pnpm only** (v10, node 24). Never `npm`/`yarn`. Don't edit lockfiles or `dist/` (generated; hooks block this).
- **Commits:** Conventional Commits, minimal atomic units as work progresses (not one big batch). English scope, Korean body OK. **No `Co-Authored-By` trailer.**
- TypeScript strict; let linters/prettier own style — don't add style notes here.
- Tests colocated as `*.test.ts(x)` / under `__tests__/`; SSR tests `pnpm test:ssr`, E2E `pnpm test:e2e` (react).

## Workflow

- Releases use **changesets** (`pnpm changeset`); base branch `master`.
- The automated AI pipeline opens `ai/issue-N` branches → PR to `develop` (see `docs/ai-pipeline.md`). Respect `ai:*` issue labels.

## Pointers

- Harness internals & maintenance: `.claude/README.md`
- Core engine details: `packages/core/CLAUDE.md`
- AI pipeline & labels: `docs/ai-pipeline.md` (Gemini track); autonomous Claude Agent SDK track: `docs/hermes-pipeline.md`
