import { writeFile } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';
import { format } from 'prettier';

const source = 'https://developers.whatnot.com/api-reference/openapi.json';
const response = await fetch(source);
if (!response.ok) throw new Error(`Could not download Whatnot OpenAPI: ${response.status}`);
const document = await response.json();
// Milestone one exposes only seller identity and disconnect. Expand this selection with new resources.
const schema = {
    ...document,
    paths: {
        '/users/me': document.paths['/users/me'],
        '/users/disconnect': document.paths['/users/disconnect'],
    },
    components: {
        ...document.components,
        schemas: { User: document.components.schemas.User, Media: document.components.schemas.Media },
    },
};
const ast = await openapiTS(schema);
const content = `// Generated from ${source}. Run npm run generate; do not edit manually.\n${astToString(ast)}`;
const formatted = await format(content, { parser: 'typescript', tabWidth: 4, singleQuote: true, printWidth: 120 });
await writeFile(new URL('../src/schema.generated.ts', import.meta.url), formatted);
