/**
 * This file is auto-generated from v1.yaml.
 * Do not edit directly.
 */
export const API_MESSAGES = {
  SharedErrors: {},
} as const;

export type ApiOperationId = keyof typeof API_MESSAGES;

export type ApiMessage<T extends ApiOperationId> = (typeof API_MESSAGES)[T];
