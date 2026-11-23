import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HTTPError, TimeoutError, WhatnotClient } from '../src/index.js';
import { createFetch, seller } from './fixtures.js';

test('authenticates PAT and OAuth tokens and resolves the current token for each call', async () => {
    const transport = createFetch(Response.json(seller), Response.json(seller), new Response(null, { status: 204 }));
    let token = 'example-personal-token';
    const client = new WhatnotClient({ accessToken: () => token, fetch: transport.fetch });
    assert.deepEqual(await client.getCurrentUser(), seller);
    token = 'example-oauth-token';
    await client.getCurrentUser();
    await client.disconnect();
    assert.equal(transport.requests[0].url, 'https://api.whatnot.com/seller-api/rest/v2/users/me');
    assert.equal(transport.requests[0].headers.get('authorization'), 'Bearer example-personal-token');
    assert.equal(transport.requests[1].headers.get('authorization'), 'Bearer example-oauth-token');
    assert.equal(transport.requests[2].method, 'POST');
    assert.equal(transport.requests[2].url, 'https://api.whatnot.com/seller-api/rest/v2/users/disconnect');
});

test('retries rate-limited reads and exposes request IDs and limit headers', async () => {
    const transport = createFetch(
        Response.json({ type: 'rate-limited' }, { status: 429, headers: { 'Retry-After': '0' } }),
        Response.json(seller, { headers: { 'X-Request-ID': 'example-request', 'RateLimit-Remaining': '7' } }),
    );
    const seen: number[] = [];
    const client = new WhatnotClient({
        accessToken: 'example-token',
        fetch: transport.fetch,
        onResponse: (response) => {
            seen.push(response.status);
            if (response.ok) {
                assert.equal(response.headers.get('X-Request-ID'), 'example-request');
                assert.equal(response.headers.get('RateLimit-Remaining'), '7');
            }
        },
    });
    assert.deepEqual(await client.getCurrentUser(), seller);
    assert.deepEqual(seen, [429, 200]);
    assert.equal(transport.requests.length, 2);
});

test('surfaces typed HTTP errors and never retries authentication errors or disconnect', async () => {
    for (const status of [401, 403, 422]) {
        const problem = { type: 'missing-scope', title: 'Missing scope', status };
        const transport = createFetch(
            Response.json(problem, { status, headers: { 'X-Request-ID': 'failed-request' } }),
        );
        const client = new WhatnotClient({ accessToken: 'example-token', fetch: transport.fetch });
        await assert.rejects(client.getCurrentUser(), (error: unknown) => {
            assert.ok(error instanceof HTTPError);
            assert.equal(error.response.status, status);
            assert.equal(error.response.headers.get('X-Request-ID'), 'failed-request');
            assert.deepEqual(error.data, problem);
            return true;
        });
        assert.equal(transport.requests.length, 1);
    }
    const transport = createFetch(new Response('Unavailable', { status: 503 }));
    const client = new WhatnotClient({ accessToken: 'example-token', fetch: transport.fetch });
    await assert.rejects(client.disconnect(), HTTPError);
    assert.equal(transport.requests.length, 1);
});

test('supports cancellation and bounds slow requests', async () => {
    const fetch: typeof globalThis.fetch = (input, init) => {
        const request = new Request(input, init);
        return new Promise((_resolve, reject) => {
            if (request.signal.aborted) reject(request.signal.reason);
            else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true });
        });
    };
    const client = new WhatnotClient({ accessToken: 'example-token', fetch, timeout: 20, maxRetries: 0 });
    await assert.rejects(client.getCurrentUser(), TimeoutError);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(client.getCurrentUser({ signal: controller.signal }), { name: 'AbortError' });
});

test('bounds retries and accepts an explicit API base URL with or without a trailing slash', async () => {
    const transport = createFetch(
        new Response(null, { status: 429, headers: { 'Retry-After': '0' } }),
        new Response(null, { status: 429, headers: { 'Retry-After': '0' } }),
    );
    const client = new WhatnotClient({
        accessToken: 'example-token',
        fetch: transport.fetch,
        maxRetries: 1,
        baseUrl: 'https://example.com/api',
    });
    await assert.rejects(client.getCurrentUser(), HTTPError);
    assert.equal(transport.requests.length, 2);
    assert.equal(transport.requests[0].url, 'https://example.com/api/users/me');
});
