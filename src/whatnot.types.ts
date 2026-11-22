import type { TokenEndpointResponse } from 'oauth4webapi';
import type { components } from './schema.generated.js';
import type { WHATNOT_SCOPES } from './whatnot.consts.js';

export type WhatnotScope = (typeof WHATNOT_SCOPES)[number];
export type WhatnotSeller = components['schemas']['User'];
// Whatnot issues expiring access tokens and rotating refresh tokens for both supported grants.
export type WhatnotTokens = TokenEndpointResponse &
    Required<Pick<TokenEndpointResponse, 'expires_in' | 'refresh_token'>>;

export type WhatnotTransportOptions = {
    fetch?: typeof globalThis.fetch;
    timeout?: number;
    maxRetries?: number;
    onResponse?: (response: Response) => void | Promise<void>;
};

export type WhatnotRequestOptions = {
    signal?: AbortSignal;
};

export type WhatnotClientOptions = WhatnotTransportOptions & {
    accessToken: string | (() => string | Promise<string>);
    baseUrl?: string;
};

export type WhatnotOAuthOptions = WhatnotTransportOptions & {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
};
