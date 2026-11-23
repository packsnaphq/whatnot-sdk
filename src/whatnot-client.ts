import { createHttpClient } from './http.js';
import { WHATNOT_API_URL } from './whatnot.consts.js';
import type { WhatnotClientOptions, WhatnotRequestOptions, WhatnotSeller } from './whatnot.types.js';

export class WhatnotClient {
    private readonly http;
    private readonly baseUrl;

    constructor(private readonly options: WhatnotClientOptions) {
        this.http = createHttpClient(options);
        this.baseUrl = (options.baseUrl ?? WHATNOT_API_URL).replace(/\/?$/, '/');
    }

    async getCurrentUser(options: WhatnotRequestOptions = {}): Promise<WhatnotSeller> {
        const headers = await this.headers();
        const url = new URL('users/me', this.baseUrl);
        return this.http.get(url, { headers, signal: options.signal }).json<WhatnotSeller>();
    }

    async disconnect(options: WhatnotRequestOptions = {}): Promise<void> {
        const headers = await this.headers();
        const url = new URL('users/disconnect', this.baseUrl);
        await this.http.post(url, { headers, signal: options.signal, retry: 0 });
    }

    private async headers() {
        const token =
            typeof this.options.accessToken === 'function'
                ? await this.options.accessToken()
                : this.options.accessToken;
        return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    }
}
