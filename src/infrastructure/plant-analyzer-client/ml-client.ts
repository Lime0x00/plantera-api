import type {
  MlClassifyResponse,
  MlDiagnoseResponse,
  MlErrorResponse,
} from './types';

export interface MlClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class MlClient {
  #baseUrl: string;
  #timeout: number;

  constructor(config: MlClientConfig) {
    this.#baseUrl = config.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
    this.#timeout = config.timeout ?? 30000;
  }

  async classify(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<MlClassifyResponse> {
    const form = new FormData();
    const ext = mimeType.split('/')[1] || 'jpg';
    form.append(
      'image',
      new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
      `plant.${ext}`
    );

    const res = await fetch(`${this.#baseUrl}/v1/classify`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(this.#timeout),
    });

    if (!res.ok) {
      const errBody = (await res.json()) as MlErrorResponse;
      throw new Error(errBody.message || `ML classify returned ${res.status}`);
    }

    return res.json() as Promise<MlClassifyResponse>;
  }

  async diagnose(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<MlDiagnoseResponse> {
    const form = new FormData();
    const ext = mimeType.split('/')[1] || 'jpg';
    form.append(
      'image',
      new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
      `plant.${ext}`
    );

    const res = await fetch(`${this.#baseUrl}/v1/diagnose`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(this.#timeout),
    });

    if (!res.ok) {
      const errBody = (await res.json()) as MlErrorResponse;
      throw new Error(errBody.message || `ML diagnose returned ${res.status}`);
    }

    return res.json() as Promise<MlDiagnoseResponse>;
  }

  get baseUrl(): string {
    return this.#baseUrl;
  }
}
