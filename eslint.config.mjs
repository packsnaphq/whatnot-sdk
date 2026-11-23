import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist/', 'src/schema.generated.ts'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
    { rules: { '@typescript-eslint/consistent-type-definitions': ['error', 'type'] } },
);
