import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { OAuthError, WhatnotOAuth } from '../src/index.js';
import { createFetch, tokenResponse } from './fixtures.js';

const options = {
    clientId: 'example-client',
    clientSecret: 'example-client-secret',
    redirectUri: 'https://example.com/oauth/whatnot',
};

test('creates fresh state and PKCE, and validates callback state and denial', async () => {
    const oauth = new WhatnotOAuth(options);
    const first = await oauth.createAuthorizationRequest(['read:orders', 'read:shows']);
    const second = await oauth.createAuthorizationRequest(['read:orders']);
    const url = new URL(first.url);
    const challenge = createHash('sha256').update(first.codeVerifier).digest('base64url');
    assert.equal(url.origin, 'https://api.whatnot.com');
    assert.equal(url.searchParams.get('scope'), 'read:orders read:shows');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('code_challenge'), challenge);
    assert.equal(url.searchParams.get('state'), first.state);
    assert.equal(url.searchParams.get('redirect_uri'), options.redirectUri);
    assert.ok(!first.url.includes(options.clientSecret));
    assert.notEqual(first.state, second.state);
    assert.notEqual(first.codeVerifier, second.codeVerifier);
    const callback = new URL(options.redirectUri);
    callback.search = new URLSearchParams({ code: 'example-code', state: first.state }).toString();
    assert.equal(oauth.validateCallback(callback, first.state).get('code'), 'example-code');
    assert.throws(() => oauth.validateCallback(callback, second.state));
    callback.search = new URLSearchParams({ error: 'access_denied', state: first.state }).toString();
    assert.throws(() => oauth.validateCallback(callback, first.state));
});

test('exchanges, refreshes and revokes using Whatnot Bearer client authentication', async () => {
    const transport = createFetch(
        Response.json(tokenResponse),
        Response.json({ ...tokenResponse, refresh_token: 'rotated-refresh' }),
        new Response(null, { status: 200 }),
    );
    const oauth = new WhatnotOAuth({ ...options, fetch: transport.fetch });
    const exchanged = await oauth.exchangeCode('example-code', 'example-verifier');
    assert.equal(exchanged.access_token, tokenResponse.access_token);
    const refreshed = await oauth.refresh(exchanged.refresh_token);
    assert.equal(refreshed.refresh_token, 'rotated-refresh');
    await oauth.revoke(refreshed.refresh_token);
    const bodies = await Promise.all(transport.requests.map((request) => request.clone().text()));
    assert.deepEqual(Object.fromEntries(new URLSearchParams(bodies[0])), {
        grant_type: 'authorization_code',
        client_id: options.clientId,
        code: 'example-code',
        code_verifier: 'example-verifier',
        redirect_uri: options.redirectUri,
    });
    assert.deepEqual(Object.fromEntries(new URLSearchParams(bodies[1])), {
        grant_type: 'refresh_token',
        client_id: options.clientId,
        refresh_token: tokenResponse.refresh_token,
    });
    assert.deepEqual(Object.fromEntries(new URLSearchParams(bodies[2])), {
        client_id: options.clientId,
        token: 'rotated-refresh',
    });
    for (const request of transport.requests) {
        assert.equal(request.method, 'POST');
        assert.equal(request.headers.get('authorization'), `Bearer ${options.clientSecret}`);
        assert.ok(!request.url.includes(options.clientSecret));
    }
    assert.equal(transport.requests[0].url, 'https://api.whatnot.com/seller-api/rest/oauth/token');
    assert.equal(transport.requests[2].url, 'https://api.whatnot.com/seller-api/rest/oauth/revoke');
});

test('preserves OAuth invalid_grant errors without retrying refresh tokens', async () => {
    const transport = createFetch(Response.json({ error: 'invalid_grant' }, { status: 400 }));
    const oauth = new WhatnotOAuth({ ...options, fetch: transport.fetch, maxRetries: 3 });
    await assert.rejects(oauth.refresh('expired'), (error: unknown) => {
        assert.ok(error instanceof OAuthError);
        assert.equal(error.error, 'invalid_grant');
        assert.equal(error.status, 400);
        return true;
    });
    assert.equal(transport.requests.length, 1);
});

test('does not retry ambiguous token exchange or revocation failures', async () => {
    for (const operation of ['exchange', 'refresh', 'revoke']) {
        const transport = createFetch(new Response('Temporarily unavailable', { status: 503 }));
        const oauth = new WhatnotOAuth({ ...options, fetch: transport.fetch, maxRetries: 3 });
        const result =
            operation === 'exchange'
                ? oauth.exchangeCode('code', 'verifier')
                : operation === 'refresh'
                  ? oauth.refresh('refresh')
                  : oauth.revoke('token');
        await assert.rejects(result);
        assert.equal(transport.requests.length, 1);
    }
});
