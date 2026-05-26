# Plan

## Goal

The goal is to establish a minimal smoke test for the `scrolloop` repository. This test will quickly verify the basic functionality and ensure that the project can build and its core components are operational after any changes, without running the full test suite.

## Affected files

None. This plan defines how to execute existing tests as a smoke test, and does not involve modifying any project files.

## Steps

1. Execute the `vitest` command from the root directory of the repository. This command is expected to discover and run all configured tests across the monorepo's packages.

## Test plan

- **Existing tests to run**:
  - `vitest` (executed from the project root directory)
- **New tests Generator should add**:
  - No new tests are to be added as part of this smoke test plan. The objective is to utilize existing test infrastructure.

## Risks / unknowns

- The `vitest` configuration at the root level might not be set up to run tests across all sub-packages, or it might run the full test suite, making it not "minimal" enough for a smoke test. If this is the case, individual `vitest` commands for core packages like `packages/core`, `packages/shared`, and `packages/react` might be necessary.
- There might be specific build steps required before `vitest` can run successfully, which are not explicitly included in a simple `vitest` command.

## Out of scope

- Implementing new features or fixing existing bugs.
- Writing new unit or integration tests.
- Optimizing existing test suites for performance.
- Investigating or fixing any failing tests identified by the smoke test. The purpose is solely to define the execution of the smoke test.
