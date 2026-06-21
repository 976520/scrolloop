# Releasing

scrolloop publishes scoped packages (`@scrolloop/core`, `@scrolloop/react`,
`@scrolloop/react-native`, `@scrolloop/preact`, `@scrolloop/vue`,
`@scrolloop/svelte`) via [Changesets](https://github.com/changesets/changesets).
The repo root is `private` and is not published.

## Day-to-day

1. With your change, add a changeset describing it and which packages bump:
   ```bash
   pnpm changeset
   ```
   Commit the generated `.changeset/*.md` file alongside your code.
2. Open a PR. CI runs lint / typecheck / knip / `lint:package` (publint + attw) /
   size / test / e2e as merge gates.

## Publishing (automated)

On push to `master`, the `release` job runs `changesets/action`:

- If unreleased changesets exist → it opens/updates a **"Version Packages"** PR
  that bumps versions and writes changelogs (`pnpm version`).
- When that PR is merged → it publishes the changed packages to npm with
  provenance (`pnpm release` = build + `changeset publish`).

### One-time setup

- Add an `NPM_TOKEN` repo secret (granular automation token with publish rights
  to the `scrolloop` package and the `@scrolloop` scope), or configure npm
  **Trusted Publishing** (OIDC) per package — `release` already has `id-token: write`.
- First release: package versions are set directly to `1.0.0` (no changeset),
  so `changesets/action` publishes them on the first master push. `scrolloop`
  goes `0.5.2 → 1.0.0`; the `@scrolloop/*` adapters are published fresh at
  `1.0.0`. Changesets governs every release after that.

## Breaking change in `scrolloop@1.0.0`

`scrolloop` is now the **framework-agnostic core** (Virtualizer, InfiniteSource,
layout/scroll utilities) that every adapter depends on — like `eslint` is the
core that `eslint-plugin-*` build on. Every `@scrolloop/<framework>` install
pulls `scrolloop` transitively, so its download count and history continue on
this package.

The previous `scrolloop@0.5.x` shipped the **React components** directly. Those
moved to `@scrolloop/react`. Existing React users migrate:

```diff
- import { VirtualList } from "scrolloop";
+ import { VirtualList } from "@scrolloop/react";
```

## Local checks

```bash
pnpm changeset status --verbose   # preview which packages version/publish (read-only)
pnpm lint:package                 # publint + attw on every publishable package
```
