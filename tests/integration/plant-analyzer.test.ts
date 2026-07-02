import { describe, it, expect, beforeAll } from 'vitest';
import { MlClient } from '#infrastructure/plant-analyzer-client';

const ANALYZER_URL = process.env.ANALYZER_URL || 'http://localhost:5000/v1';
const RUN_INTEGRATION = process.env.INTEGRATION === 'true';

const runIf = (condition: boolean) => (condition ? it : it.skip);

let mlClient: MlClient;

beforeAll(() => {
  mlClient = new MlClient({ baseUrl: ANALYZER_URL, timeout: 5000 });
});

describe('Plant Analyzer integration', () => {
  runIf(RUN_INTEGRATION)(
    'should respond on health endpoint',
    async () => {
      const res = await fetch(`${ANALYZER_URL}/health`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(body.success).toBe(true);
    },
    10000
  );

  runIf(RUN_INTEGRATION)(
    'should reject empty image with error',
    async () => {
      await expect(
        mlClient.classify(Buffer.alloc(0), 'image/jpeg')
      ).rejects.toThrow();
    },
    15000
  );

  runIf(RUN_INTEGRATION)(
    'should reject invalid image format',
    async () => {
      const fakeImage = Buffer.from('not-an-image-data');
      await expect(
        mlClient.classify(fakeImage, 'image/jpeg')
      ).rejects.toThrow();
    },
    15000
  );
});
