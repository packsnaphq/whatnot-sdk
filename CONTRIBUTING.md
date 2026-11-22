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

Contributions are licensed under the repository's MIT license. Do not copy private code, credentials or customer data.
