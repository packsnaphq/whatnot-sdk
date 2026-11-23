# Contributing

This is a community SDK maintained by PackSnap, with no affiliation or endorsement from Whatnot.

Use Node.js 22.12 or newer and npm:

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run lint
```

Use `npm run format` to format changes. Follow [AGENTS.md](AGENTS.md) for layout and implementation standards.

For a new resource, link its current official documentation, generate its models from the OpenAPI definition,
and add a small typed resource method. Expand the explicit resource/model selection in `scripts/generate-types.mjs`,
then run `npm run generate`. Commit generated types with the corresponding implementation. Generation is an explicit
maintainer action; ordinary builds use the committed types and do not fetch live documentation.

Keep changes scoped and test the wire contract: URLs, authentication, request bodies, pagination, rate limits and
failure behavior as applicable. Use synthetic fixtures and injected fetch implementations. Tests must not call live
seller accounts or depend on credentials. Avoid abstraction layers without concrete reuse.

Open an issue before proposing a substantial public API change. Submit pull requests with a clear description,
relevant official documentation and verification results. Use commit messages such as `[feat] Add order retrieval`.

The initial scope is OAuth, HTTP transport and seller identity. Catalog, order, shipment, show and webhook support
can be added as separate contributions. Keep framework adapters and application sync workflows outside the core SDK.

## Releases

`main` is protected. Hof (`@hofcoral`) owns review and merging; CI must pass before merging.
Hof can merge his own pull requests using the configured review exception. Force pushes and branch deletion are blocked.

Every merge to `main` publishes the version in `package.json` to npm and creates a matching `v<version>` GitHub release
with generated release notes and the published package tarball. There is no separate release pull request.
Include a version bump in each pull request after the initial release:

```sh
npm version patch --no-git-tag-version
```

Use `minor` for new compatible functionality and `major` for breaking changes. Commit both `package.json` and
`package-lock.json`. CI requires a stable semantic version greater than the current `main` version, with the branch
up to date. Rebase and update the version if another pull request releases first.

The release workflow uses the repository's `NPM_ACCESS_TOKEN` secret. Its npm account must have write access to
`@packsnap/whatnot-sdk`, including permission to create the initial package. For unattended publishing, the granular
token must allow bypassing 2FA. The workflow publishes publicly with npm provenance and only creates the GitHub
release after npm publishing succeeds. A failed npm publish does not produce a GitHub release.

If publishing succeeds but GitHub release creation fails, create the GitHub release for the published version at
the original workflow commit; npm versions are immutable, so do not attempt to publish that version again.

Contributions are licensed under the repository's MIT license. Do not copy private code, credentials or customer data.
