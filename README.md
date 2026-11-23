# Whatnot SDK

A community TypeScript SDK for the Whatnot Seller API, maintained by [PackSnap](https://packsnap.io).
It is not an official Whatnot SDK and is not affiliated with or endorsed by Whatnot.

The first milestone covers personal-token access, OAuth with PKCE, refresh and revocation,
current-seller identity, and disconnecting an installation. It reuses
[oauth4webapi](https://github.com/panva/oauth4webapi) and [ky](https://github.com/sindresorhus/ky).
Seller models are generated from Whatnot's current OpenAPI definition.

## Install

```sh
npm install @packsnap/whatnot-sdk
```

Merging to `main` runs verification, publishes the package version to npm and creates a GitHub release.
TypeScript is not required by applications consuming the built package.

Requires Node.js 22.12 or newer. ESM imports and Node's synchronous `require()` of ESM are supported.
The library uses Fetch/Web Crypto APIs and does not depend on NestJS, a database or a particular web framework.

## Personal access tokens

```ts
import { WhatnotClient } from '@packsnap/whatnot-sdk';

const client = new WhatnotClient({ accessToken: process.env.WHATNOT_ACCESS_TOKEN! });
const seller = await client.getCurrentUser();
console.log(seller.username);
```

Both personal access tokens and OAuth access tokens use Bearer authentication. Tokens are supplied by the consumer;
the SDK does not read environment variables itself. An async `accessToken` function may be used to obtain the current
stored token before each request. Refresh coordination and persistence remain your application's responsibility.

## Server-side OAuth

```ts
import { WhatnotClient, WhatnotOAuth } from '@packsnap/whatnot-sdk';

const oauth = new WhatnotOAuth({
    clientId: process.env.WHATNOT_CLIENT_ID!,
    clientSecret: process.env.WHATNOT_CLIENT_SECRET!,
    redirectUri: 'https://your-app.example/oauth/whatnot/callback',
});

const authorization = await oauth.createAuthorizationRequest(['read:orders', 'read:shows']);
// Bind authorization.state and authorization.codeVerifier to the initiating user/session.
// Store them server-side with an expiry and single-use protection, then redirect to authorization.url.
```

On callback, recover the state and verifier for that user/session. Validate the callback before exchanging its code:

```ts
// callbackUrl is the incoming URL; savedState and savedVerifier come from your server-side storage.
const parameters = oauth.validateCallback(callbackUrl, savedState);
const code = parameters.get('code')!;
const tokens = await oauth.exchangeCode(code, savedVerifier);
const sellerClient = new WhatnotClient({ accessToken: tokens.access_token });
const seller = await sellerClient.getCurrentUser();
// Persist the seller identity and encrypted token set in your application.
```

`validateCallback` rejects mismatched state, OAuth denial and malformed callback parameters using oauth4webapi.
Applications that accept a code/state POST instead can atomically validate and claim their stored state before
calling `exchangeCode`, as PackSnap does. The SDK never stores state or tokens.

```ts
const rotated = await oauth.refresh(storedRefreshToken);
// Persist rotated.refresh_token together with the new access token before allowing another refresh.

await oauth.revoke(tokenToRevoke);
// To disconnect the seller's entire installation and expire its tokens instead:
await sellerClient.disconnect();
```

Whatnot uses `Authorization: Bearer <client secret>` at its OAuth endpoints. The SDK supplies that provider-specific
authentication to oauth4webapi. Credentials must remain server-side; never bundle the OAuth client secret in a browser.
OAuth token types reuse oauth4webapi's response type, with Whatnot's documented expiry and refresh-token fields required.

## HTTP options, errors and rate limits

`WhatnotClient` and `WhatnotOAuth` accept `fetch`, `timeout` (milliseconds), `maxRetries` and `onResponse`.
API calls and OAuth methods accept `{ signal }` for cancellation. `WhatnotClient` additionally accepts `baseUrl`
for an explicit API override. OAuth uses Whatnot's published production endpoints.

```ts
import { HTTPError, OAuthError, WhatnotClient } from '@packsnap/whatnot-sdk';

const client = new WhatnotClient({
    accessToken: token,
    timeout: 10_000,
    maxRetries: 2,
    onResponse(response) {
        const requestId = response.headers.get('X-Request-ID');
        const remaining = response.headers.get('RateLimit-Remaining');
        // Record selected metadata in your own metrics system.
    },
});

try {
    await client.getCurrentUser();
} catch (error) {
    if (error instanceof HTTPError) {
        // error.response.status, error.response.headers and error.data contain the provider error.
    }
    throw error;
}

// OAuthError exposes .error (for example invalid_grant), .status and .response.
// TimeoutError, NetworkError and OAuthAuthorizationError are also exported from their underlying libraries.
```

Read requests default to at most two retries, using ky's backoff, jitter and `Retry-After` handling. The default
per-attempt timeout is 10 seconds and the total request budget is three times the configured timeout. A retry that
would exceed that total budget fails rather than ignoring the server's requested wait. Token exchange, refresh,
revocation and disconnect are never retried automatically, including when maxRetries is set.

Whatnot currently documents 10 requests per second per seller per connected app. This SDK exposes response headers
and retries throttled reads; it does not coordinate a shared rate limiter across clients or application instances.
Do not log whole HTTP errors, request objects or client instances: underlying library errors may contain credentials
in request headers/options. Select status, request ID and safe metadata instead.

## Development and contributions

See [CONTRIBUTING.md](CONTRIBUTING.md). API expansion is welcome as small, documented contributions.
Ordinary builds use committed generated models; `npm run generate` explicitly refreshes the selected resource models.

References: [Whatnot API](https://developers.whatnot.com/getting-started/introduction),
[authentication](https://developers.whatnot.com/getting-started/authentication),
[OAuth metadata](https://api.whatnot.com/.well-known/oauth-authorization-server/seller-api),
[rate limits](https://developers.whatnot.com/getting-started/rate-limits),
[errors](https://developers.whatnot.com/errors).

MIT licensed. The generated API models describe Whatnot's API contract; Whatnot's service and documentation remain
subject to their own terms.
