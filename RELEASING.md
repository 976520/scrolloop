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
  to the `@scrolloop` scope), or configure npm **Trusted Publishing** (OIDC) for
  each package — the `release` job already has `id-token: write`.
- First publish: each `@scrolloop/*` package is published fresh at the version in
  its `package.json` (see the initial changeset).

## Deprecating the legacy `scrolloop` package

The old single `scrolloop` package (React-only) is superseded by
`@scrolloop/react`. After the first scoped release, run once:

```bash
npm deprecate scrolloop "Renamed to @scrolloop/react — see https://github.com/976520/scrolloop"
```

## Local checks

```bash
pnpm changeset status --verbose   # preview which packages version/publish (read-only)
pnpm lint:package                 # publint + attw on every publishable package
```
