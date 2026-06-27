# @scrolloop/core

The framework-agnostic engine. **All scrolling/virtualization logic lives here**; adapters only bind it to a framework. If you're tempted to put logic in an adapter, it almost certainly belongs here or in `@scrolloop/shared`.

## Layout (`src/`)

- `virtualizer/` — windowing math: which items are visible, their offsets/sizes, overscan.
- `strategies/` — measurement strategies (fixed / dynamic / estimated item sizes).
- `plugins/` — opt-in behaviors layered onto the virtualizer.
- `InfiniteSource.ts` — infinite-loading state machine (paging, thresholds, status).
- `utils/`, `types/` — pure helpers and shared types. `index.ts` is the public surface.

## Rules

- **No framework imports.** No `react`, `vue`, DOM-framework, or `react-native` deps. Browser/DOM APIs only behind capability checks so SSR and RN stay safe.
- Keep the public API (`index.ts`) stable and intentional — every adapter depends on it. After changing it, propagate to all adapters and run the `adapter-parity-reviewer` subagent.
- Hot paths (scroll handlers, range computation) run per frame — avoid per-item allocations and O(n) scans where a binary search / cached offset works.
- Cover new logic with colocated `*.test.ts` (vitest). `pnpm --filter @scrolloop/core test`.
