import type { WhatnotSeller } from '../src/index.js';

export const seller: WhatnotSeller = {
    id: '1234567',
    username: 'example_seller',
    display_name: 'Example seller',
    image: null,
    seller_currency: 'USD',
    country_code: 'US',
    can_go_live: true,
};

export const tokenResponse = {
    access_token: 'example-access',
    refresh_token: 'example-refresh',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'read:orders read:shows',
};

export const createFetch = (...responses: Response[]) => {
    const requests: Request[] = [];
    const fetch: typeof globalThis.fetch = async (input, init) => {
        requests.push(new Request(input, init));
        const response = responses.shift();
        if (!response) throw new Error('Unexpected request');
        return response;
    };
    return { requests, fetch };
};
