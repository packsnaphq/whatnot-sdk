import {
    calculatePKCECodeChallenge,
    customFetch,
    generateRandomCodeVerifier,
    generateRandomState,
    genericTokenEndpointRequest,
    processGenericTokenEndpointResponse,
    processRevocationResponse,
    revocationRequest,
    validateAuthResponse,
    type ClientAuth,
} from 'oauth4webapi';
import { createHttpClient } from './http.js';
import { WHATNOT_AUTHORIZATION_SERVER } from './whatnot.consts.js';
import type { WhatnotOAuthOptions, WhatnotRequestOptions, WhatnotScope, WhatnotTokens } from './whatnot.types.js';

export class WhatnotOAuth {
    private readonly http;

    constructor(private readonly options: WhatnotOAuthOptions) {
        this.http = createHttpClient({ ...options, maxRetries: 0 });
    }

    get clientId() {
        return this.options.clientId;
    }

    async createAuthorizationRequest(scopes: readonly WhatnotScope[]) {
        const state = generateRandomState();
        const codeVerifier = generateRandomCodeVerifier();
        const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
        const url = new URL(WHATNOT_AUTHORIZATION_SERVER.authorization_endpoint);
        url.search = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.options.redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        }).toString();
        return { url: url.toString(), state, codeVerifier };
    }

    validateCallback(url: URL, expectedState: string) {
        const client = { client_id: this.clientId };
        return validateAuthResponse(WHATNOT_AUTHORIZATION_SERVER, client, url, expectedState);
    }

    exchangeCode(code: string, codeVerifier: string, options: WhatnotRequestOptions = {}) {
        return this.token(
            'authorization_code',
            {
                code,
                code_verifier: codeVerifier,
                redirect_uri: this.options.redirectUri,
            },
            options,
        );
    }

    refresh(refreshToken: string, options: WhatnotRequestOptions = {}) {
        return this.token('refresh_token', { refresh_token: refreshToken }, options);
    }

    async revoke(token: string, options: WhatnotRequestOptions = {}): Promise<void> {
        const client = { client_id: this.clientId };
        const requestOptions = this.requestOptions(options);
        const response = await revocationRequest(
            WHATNOT_AUTHORIZATION_SERVER,
            client,
            this.authenticate,
            token,
            requestOptions,
        );
        await processRevocationResponse(response);
    }

    // Whatnot authenticates clients with a Bearer client secret, rather than HTTP Basic.
    private readonly authenticate: ClientAuth = (_server, client, body, headers) => {
        body.set('client_id', client.client_id);
        headers.set('Authorization', `Bearer ${this.options.clientSecret}`);
    };

    private requestOptions(options: WhatnotRequestOptions) {
        return {
            signal: options.signal,
            [customFetch]: (url: string, init: RequestInit) =>
                this.http(url, { ...init, throwHttpErrors: false, retry: 0 }),
        };
    }

    private async token(grant: string, parameters: Record<string, string>, options: WhatnotRequestOptions) {
        const client = { client_id: this.clientId };
        const requestOptions = this.requestOptions(options);
        const response = await genericTokenEndpointRequest(
            WHATNOT_AUTHORIZATION_SERVER,
            client,
            this.authenticate,
            grant,
            parameters,
            requestOptions,
        );
        const tokens = await processGenericTokenEndpointResponse(WHATNOT_AUTHORIZATION_SERVER, client, response);
        return tokens as WhatnotTokens;
    }
}
