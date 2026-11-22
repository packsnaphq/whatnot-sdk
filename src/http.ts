import ky from 'ky';
import type { WhatnotTransportOptions } from './whatnot.types.js';

export const createHttpClient = (options: WhatnotTransportOptions) =>
    ky.create({
        fetch: options.fetch ?? ((input, init) => globalThis.fetch(input, init)),
        timeout: options.timeout ?? 10_000,
        totalTimeout: (options.timeout ?? 10_000) * 3,
        redirect: 'error',
        retry: { limit: options.maxRetries ?? 2, methods: ['get', 'head'], jitter: true },
        hooks: {
            afterResponse: [
                async ({ response }) => {
                    await options.onResponse?.(response);
                },
            ],
        },
    });
