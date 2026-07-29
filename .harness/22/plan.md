# Plan

## Goal

To achieve 100% unit test coverage for the `@scrolloop/react` package. This initiative aims to enhance the reliability and maintainability of the React components and hooks by ensuring all code paths within the package are validated by unit tests.

## Affected files

- `packages/react/src/hooks/useTransition.ts`
- `packages/react/src/utils/domPruner.ts`
- `packages/react/src/utils/isServerSide.ts`
- `packages/react/__tests__/InfiniteList.test.tsx`
- `packages/react/__tests__/VirtualList.test.tsx`
- Potentially new test files in `packages/react/__tests__/`

## Steps

1.  **Identify Coverage Gaps:** Execute the test suite with coverage enabled for the `@scrolloop/react` package to pinpoint specific lines or branches that are not covered.
2.  **Write Tests for `useTransition.ts`:** Create comprehensive unit tests for the `useTransition` hook to ensure its state management and transition logic are thoroughly validated.
3.  **Write Tests for `domPruner.ts`:** Develop unit tests for the `domPruner` utility to verify its DOM manipulation and pruning capabilities under various conditions.
4.  **Write Tests for `isServerSide.ts`:** Implement unit tests for the `isServerSide` utility to confirm its accurate detection of server-side versus client-side environments.
5.  **Enhance Existing Tests:** Review and update the existing test files for `InfiniteList.tsx` and `VirtualList.tsx` (i.e., `InfiniteList.test.tsx` and `VirtualList.test.tsx`) to cover any remaining uncovered code identified by the coverage report.

## Test plan

- **Existing tests to run:**
  - `pnpm install`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test --filter @scrolloop/react --coverage` (This command is crucial for identifying specific uncovered lines/branches.)
- **New tests Generator should add:**
  - New test files in `packages/react/__tests__/` for `useTransition.ts`, `domPruner.ts`, and `isServerSide.ts`.
  - Additional test cases within `packages/react/__tests__/InfiniteList.test.tsx` and `packages/react/__tests__/VirtualList.test.tsx` to achieve 100% coverage.

## Risks / unknowns

- The exact current test coverage percentage and the specific code paths requiring tests are unknown without running the coverage tool. The GENERATOR agent will need to interpret the coverage report to proceed.
- Complex interdependencies or environment-specific logic within hooks and utilities might require sophisticated mocking strategies.

## Out of scope

- Modifying or refactoring the source code in `packages/react/src/`.
- Adding tests for other packages within the monorepo.
- Changes to the public API of the `@scrolloop/react` package.
- Performance optimizations unless directly related to a bug identified during testing.
