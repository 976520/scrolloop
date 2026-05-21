# Plan

## Goal

The goal is to significantly enhance the end-to-end (e2e) test coverage for the React adapter components, specifically `InfiniteList` and `VirtualList`. This will ensure the stability, functionality, and responsiveness of these components across various user interaction scenarios and prevent regressions when changes are introduced.

## Affected files

- `packages/react/playwright.config.ts` (verification, potentially minor adjustments)
- `packages/react/e2e/InfiniteList.spec.ts` (new file)
- `packages/react/e2e/VirtualList.spec.ts` (new file)

## Steps

1.  **Verify Playwright Configuration**: Review and confirm that `packages/react/playwright.config.ts` is correctly configured to run e2e tests within the React package, ensuring it targets the appropriate testing environment (e.g., a development server for the React components).
2.  **Create E2E Test Files**:
    - Create `packages/react/e2e/InfiniteList.spec.ts` to house e2e tests for the `InfiniteList` component.
    - Create `packages/react/e2e/VirtualList.spec.ts` to house e2e tests for the `VirtualList` component.
3.  **Implement Basic Rendering Tests**: For both `InfiniteList` and `VirtualList`, add tests to verify that the components render correctly with initial data, display the expected number of visible items, and handle empty states gracefully.
4.  **Implement Scrolling Behavior Tests**:
    - For `VirtualList`, add tests to verify smooth scrolling to various positions (e.g., top, middle, bottom), ensuring the correct items are rendered and unrendered as the viewport changes.
    - For `InfiniteList`, add tests to simulate scrolling to the end of the list, triggering the `onLoadMore` callback, and verifying that new items are appended and rendered correctly.
5.  **Implement Window Resizing Tests**: Add tests to simulate browser window resizing events and assert that both `InfiniteList` and `VirtualList` adapt their virtualization logic and re-render correctly, maintaining proper item visibility and scroll positions.
6.  **Implement Dynamic Data Manipulation Tests**: For `InfiniteList`, include tests that simulate adding or removing items dynamically (e.g., after initial load, or during an `onLoadMore` call) and verify the component updates visually without issues.

## Test plan

- **Existing tests to run**:
  - `npm test --workspace=packages/react` (to run existing unit/integration tests with Vitest)
  - `npx playwright test` (to run any existing or newly created Playwright e2e tests within the `packages/react` directory)
- **New tests Generator should add**:
  - `packages/react/e2e/InfiniteList.spec.ts`:
    - Initial render with data.
    - Scroll to end and load more data.
    - Handle empty list state.
    - Dynamic item additions/removals.
    - Window resize adaptability.
  - `packages/react/e2e/VirtualList.spec.ts`:
    - Initial render with data.
    - Scroll to specific items and verify visibility.
    - Handle empty list state.
    - Window resize adaptability.
    - Tests for different item heights (if variable height is supported).

## Risks / unknowns

- **Playwright setup complexity**: Ensuring Playwright can correctly interact with the development server for the React package might require specific configuration or mocking if a full build is not desired for e2e tests.
- **Test Flakiness**: E2E tests can be prone to flakiness due to timing issues or browser inconsistencies. Careful use of Playwright's waiting mechanisms will be crucial.
- **Performance Impact**: Running a comprehensive suite of e2e tests can be time-consuming, potentially impacting CI/CD pipeline duration.

## Out of scope

- Implementing specific visual regression tests (e.g., screenshot comparisons) beyond basic rendering verification.
- Refactoring or optimizing the `InfiniteList` or `VirtualList` components themselves.
- Adding unit or integration tests to the existing `*.test.tsx` files.
- Fixing any existing bugs uncovered during the e2e test development, which would be addressed in separate tasks.
