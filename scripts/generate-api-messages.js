import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.resolve(__dirname, '../src/openapi/v1.json');
const outputPath = path.resolve(
  __dirname,
  '../src/common/types/generated/api-messages.ts'
);

try {
  const fileContents = fs.readFileSync(openapiPath, 'utf8');
  const spec = JSON.parse(fileContents);

  const messages = {};

  // Extract from paths
  for (const [pathKey, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation.operationId && operation.responses) {
        messages[operation.operationId] = {};
        for (const [statusCode, response] of Object.entries(
          operation.responses
        )) {
          let description = response.description;

          if (!description && response.$ref) {
            const refPath = response.$ref.replace('#/', '').split('/');
            let refObj = spec;
            for (const key of refPath) {
              if (refObj) refObj = refObj[key];
            }
            description = refObj?.description || '';
          }

          if (description) {
            messages[operation.operationId][statusCode] = description
              .replace(/\s+/g, ' ')
              .trim();
          }
        }
      }
    }
  }

  // Extract shared errors from components
  messages['SharedErrors'] = {};
  if (spec.components && spec.components.responses) {
    for (const [key, response] of Object.entries(spec.components.responses)) {
      if (response.description) {
        messages['SharedErrors'][key] = response.description
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  const tsContent = `/**
 * This file is auto-generated from v1.yaml.
 * Do not edit directly.
 */
export const API_MESSAGES = ${JSON.stringify(messages, null, 2)} as const;

export type ApiOperationId = keyof typeof API_MESSAGES;

export type ApiMessage<T extends ApiOperationId> = typeof API_MESSAGES[T];
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, tsContent);
  console.log('✅ Generated API_MESSAGES from OpenAPI spec.');
} catch (error) {
  console.error('❌ Failed to generate API messages:', error);
  process.exit(1);
}
