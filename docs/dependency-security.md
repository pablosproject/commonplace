# Dependency security

Run `npm ci` and `npm audit --json` at the repository root, including development
and optional dependencies. Commit the lockfile with dependency changes; an
unconstrained refresh can reintroduce vulnerable transitive versions.

## WyW build-time overrides

The root `package.json` overrides only `@wyw-in-js/shared@2.7.1` and
`@wyw-in-js/transform@2.7.1`. These releases still request vulnerable major
versions even with current Linaria packages:

- `minimatch` 9 is affected by glob amplification denial of service
  ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)).
  Both WyW packages use `Minimatch` construction and `.match()`, which remain
  available in the pinned 11.0.8. They do not use the removed `makeRe()`, AST,
  regular-expression sets or other removed methods. Feature include/exclude
  globs and transform import globs were checked against the resolved override;
  the production build also exercises Linaria CSS extraction.
- `happy-dom` 20 is affected by host code execution, SSRF and cookie domain
  validation advisories. The transform override pins 21.0.4, which fixes the
  reported issues. WyW's DOM context creation, element access and teardown were
  checked with this version, including verifying that DOM initialization did not
  silently fall back to an empty context. Version 21 disables external CSS and
  iframe loading by default; leave these protections enabled during builds.

The web tests explicitly depend on the patched Happy DOM and exercise the
application's routes and home-link navigation with React Router 7 and the
Linaria Vite plugin.

Remove these version-scoped overrides when updating WyW to releases that request
patched dependencies themselves. Recheck their consumers and run `npm run check`,
`npm test`, `npm run build`, a clean `npm ci` and the complete audit when changing
them. Passing these checks is compatibility evidence for this application, not a
guarantee that every upstream API or platform is covered.

## CLI build tooling

The lockfile resolves tsup 8's esbuild to 0.27.2, within tsup's declared range and
outside the affected 0.27.3–0.28.0 range for
[GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr). This avoids
an unnecessary tsup 9 migration and its higher Node.js build requirement. Other
consumers use esbuild 0.28.2. Re-audit after refreshing the lockfile rather than
assuming every newer patch release is safe.
