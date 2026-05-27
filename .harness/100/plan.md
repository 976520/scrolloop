````markdown
# Plan

## Goal

The goal is to add a minimal smoke test for the `VirtualList` component in the React package. This test will verify that the component can be rendered without errors, ensuring basic functionality and preventing regressions from accidental breakages during future development.

## Affected files

- `packages/react/src/components/VirtualList.test.tsx`

## Steps

1.  Add a new test case to `packages/react/src/components/VirtualList.test.tsx` that renders the `VirtualList` component with minimal valid props.
2.  Assert that the component is present in the document.

## Test plan

- **Existing tests to run:**
  - `pnpm test --filter @scrolloop/react` (to run all tests in the react package)
- **New tests Generator should add:**
  - `packages/react/src/components/VirtualList.test.tsx`: A new `it` block inside the `describe('VirtualList')` suite, verifying that the `VirtualList` component renders without errors. For example:
    ```typescript
    it('renders without crashing', () => {
      render(<VirtualList count={10} itemSize={50} height={400} renderItem={(index) => <div data-testid={`item-${index}`}>Item {index}</div>} />);
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
    });
    ```

## Risks / unknowns

- The current defaultProps in `VirtualList.test.tsx` use `data-testid` for items. I'll use that for the assertion in the smoke test instead of `getByRole('list')` for consistency.

## Out of scope

- Thorough testing of `VirtualList`'s virtualization logic, scrolling behavior, or performance.
- Adding smoke tests for other frameworks or components. This is strictly a _minimal_ smoke test.
````
