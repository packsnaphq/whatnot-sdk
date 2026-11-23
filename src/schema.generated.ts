// Generated from https://developers.whatnot.com/api-reference/openapi.json. Run npm run generate; do not edit manually.
export interface paths {
    '/users/me': {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the current user
         * @description Retrieve the seller authenticated by the calling application's token.
         */
        get: operations['get_me_users_me_get'];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    '/users/disconnect': {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Disconnect the current application
         * @description Remove the authenticated seller's installation of the calling application and expire its tokens, including refresh tokens. Subsequent requests using this installation's tokens are unauthorized. Other installations are unaffected.
         */
        post: operations['disconnect_users_disconnect_post'];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** User */
        User: {
            /**
             * Id
             * @description The user's ID, encoded as a decimal string.
             */
            id: string;
            /**
             * Username
             * @description The user's username.
             */
            username: string;
            /**
             * Display Name
             * @description The user's display name, if set.
             */
            display_name: string | null;
            /** @description The user's profile image, if set. */
            image: components['schemas']['Media'] | null;
            /**
             * Seller Currency
             * @description The seller's ISO 4217 currency code.
             */
            seller_currency: string;
            /**
             * Country Code
             * @description The user's ISO 3166-1 alpha-2 country code.
             */
            country_code: string | null;
            /**
             * Can Go Live
             * @description Whether the user is allowed to go live.
             */
            can_go_live: boolean;
        };
        /** Media */
        Media: {
            /**
             * Id
             * @description The image's id.
             */
            readonly id?: string | null;
            /**
             * Url
             * @description On create, the image URL to ingest. On read, the CDN URL of the ingested image.
             */
            url: string;
            /**
             * Alt
             * @description The image's alt text / label, if set.
             */
            alt?: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    get_me_users_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['User'];
                };
            };
            /** @description A valid seller API token is required. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    disconnect_users_disconnect_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A valid seller API token is required. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The application could not be disconnected. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
