# Whatnot SDK standards

Keep this SDK small, framework-independent and usable outside PackSnap.

- Prioritize simplicity, readable code, concrete reuse and existing maintained libraries.
- One class per file. Keep shared types and constants in their owning `*.types.ts` and `*.consts.ts` files.
- Use `type` aliases, inference and existing library types instead of duplicate shapes.
- Generate API models from the official OpenAPI schema with `npm run generate`. Never patch generated files.
- Reuse oauth4webapi for OAuth and ky for HTTP, retries, timeouts and cancellation. Do not implement custom crypto or type guards.
- Use meaningful intermediate values for awaited calls, parsing and non-trivial transformations.
- OAuth state storage, token persistence, encryption and cross-process refresh locking belong to the consumer.
- Never retry token exchange, refresh, revocation or disconnect automatically.
- Keep credentials out of examples, logs, fixtures, issues and commits. Never include real seller data in tests.
- Use four spaces, single quotes, semicolons, strict TypeScript and bracketed commit messages.
- Work on a topic branch; do not merge or push to main without explicit authorization.
- Before handoff, run build, typecheck, tests and lint. Verify package installation when changing exports or build configuration.
