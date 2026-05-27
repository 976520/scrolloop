# Plan

## Goal

The goal is to achieve 100% unit test coverage for the `packages/react-native` package. This involves identifying any existing code paths within `src/` that lack test coverage and implementing new unit tests or modifying existing ones to cover these gaps. The focus will be on the `InfiniteList.tsx` and `VirtualList.tsx` components, as well as any relevant logic in `index.ts`.

## Affected files

- `packages/react-native/src/index.ts`
- `packages/react-native/src/types.ts` (if it contains logic requiring testing)
- `packages/react-native/src/components/InfiniteList.tsx`
- `packages/react-native/src/components/VirtualList.tsx`
- `packages/react-native/src/__tests__/index.test.ts` (new file)
- `packages/react-native/src/components/InfiniteList.test.tsx` (new file)
- `packages/react-native/src/components/VirtualList.test.tsx` (new file)

## Steps

1.  **Install dependencies and run initial coverage report:**
    - Execute `pnpm install` in the project root to ensure all dependencies are in place.
    - Run `pnpm test --filter @scrolloop/react-native --coverage` to generate an initial coverage report for the `react-native` package.
2.  **Analyze coverage report and identify gaps:**
    - Examine the output of the coverage report to pinpoint specific files, functions, and lines within `packages/react-native/src/` that have less than 100% coverage.
3.  **Create test files and implement unit tests:**
    - Create the `packages/react-native/src/__tests__` directory if it does not exist.
    - For each file identified with coverage gaps, create a corresponding test file (e.g., `packages/react-native/src/components/InfiniteList.test.tsx` for `InfiniteList.tsx`).
    - Write unit tests within these new files to cover all uncovered branches, statements, functions, and lines of code. This will involve mocking React Native components and modules as necessary to isolate the logic being tested.
    - Prioritize testing the core logic of `InfiniteList.tsx` and `VirtualList.tsx`, including props handling, rendering logic, and any event interactions.
    - If `index.ts` or `types.ts` contain export logic or utility functions, add tests for them in `packages/react-native/src/__tests__/index.test.ts`.
4.  **Iterate and verify coverage:**
    - After implementing tests, re-run `pnpm test --filter @scrolloop/react-native --coverage`.
    - Review the updated coverage report and continue to add or refine tests until 100% unit test coverage is achieved for the `react-native` package.

## Test plan

- **Existing tests to run:**
  - `pnpm test --filter @scrolloop/react-native --coverage`
- **New tests Generator should add:**
  - `packages/react-native/src/__tests__/index.test.ts`: Test any exports or utility functions in `index.ts`.
  - `packages/react-native/src/components/InfiniteList.test.tsx`: Unit tests for the `InfiniteList` component, covering its props, rendering, and interaction logic.
  - `packages/react-native/src/components/VirtualList.test.tsx`: Unit tests for the `VirtualList` component, covering its props, rendering, and interaction logic.

## Risks / unknowns

- **React Native Environment:** Testing React Native components often requires a specific testing environment or extensive mocking. The GENERATOR agent will need to ensure appropriate mocking strategies are used to achieve unit test coverage without relying on a full React Native rendering environment.
- **Complex Component Logic:** If `InfiniteList` or `VirtualList` components contain highly complex rendering logic or intricate interactions with native modules, achieving 100% coverage purely with unit tests might be challenging and require careful mocking or consideration of alternative testing approaches (which are out of scope for this task).

## Out of scope

- Integration or End-to-End tests involving actual React Native device or simulator environments.
- Modifications to the public API of the `react-native` package unless absolutely necessary for testability, and if so, this would be called out in the PR description.
- Refactoring code solely for the purpose of making it easier to test, if such refactoring significantly deviates from existing patterns or impacts other packages.
- Adding tests for other packages in the monorepo.
