import type { AuthorizationServer } from 'oauth4webapi';

export const WHATNOT_API_URL = 'https://api.whatnot.com/seller-api/rest/v2/';

// Published at https://api.whatnot.com/.well-known/oauth-authorization-server/seller-api
export const WHATNOT_AUTHORIZATION_SERVER = {
    issuer: 'https://api.whatnot.com/seller-api',
    authorization_endpoint: 'https://api.whatnot.com/seller-api/rest/oauth/authorize',
    token_endpoint: 'https://api.whatnot.com/seller-api/rest/oauth/token',
    revocation_endpoint: 'https://api.whatnot.com/seller-api/rest/oauth/revoke',
    code_challenge_methods_supported: ['S256'],
} satisfies AuthorizationServer;

export const WHATNOT_SCOPES = [
    'full_access',
    'read:inventory',
    'write:inventory',
    'read:merchandising',
    'write:merchandising',
    'read:orders',
    'write:orders',
    'read:shipments',
    'write:shipments',
    'read:customers',
    'read:reports',
    'write:reports',
    'read:shows',
] as const;
