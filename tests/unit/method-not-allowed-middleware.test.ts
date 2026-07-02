import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MethodNotAllowedError } from '#common/errors';

vi.mock('#common/errors', () => ({
  MethodNotAllowedError: class MethodNotAllowedError extends Error {
    constructor() {
      super('Method Not Allowed');
      this.name = 'MethodNotAllowedError';
    }
  },
}));

import {
  discoverRoutes,
  methodNotAllowedHandler,
} from '#framework/middleware/method-not-allowed.middleware';
import type { Router } from 'express';

function createMockLayer(overrides: Record<string, unknown> = {}) {
  return {
    route: undefined,
    handle: undefined,
    regexp: { source: '' },
    name: '<anonymous>',
    keys: [],
    method: '',
    ...overrides,
  } as never;
}

function createMockRouter(stack: unknown[] = []): Router {
  return { stack } as unknown as Router;
}

describe('discoverRoutes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('records direct routes with methods', () => {
    const layer = createMockLayer({
      route: {
        path: '/test',
        methods: { get: true, post: true },
        stack: [],
      },
    });
    const router = createMockRouter([layer]);

    discoverRoutes('/prefix', router);

    const handler = createMethodNotAllowedHandler();
    const req = {
      originalUrl: '/prefix/test',
      method: 'DELETE',
      path: '/test',
    };
    const next = vi.fn();
    handler(req as never, {} as never, next);
    expect(next).toHaveBeenCalledWith(expect.any(MethodNotAllowedError));
  });

  it('allows registered methods', () => {
    const layer = createMockLayer({
      route: {
        path: '/test',
        methods: { get: true },
        stack: [],
      },
    });
    const router = createMockRouter([layer]);

    discoverRoutes('/prefix', router);

    const handler = createMethodNotAllowedHandler();
    const req = { originalUrl: '/prefix/test', method: 'GET', path: '/test' };
    const next = vi.fn();
    handler(req as never, {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() for unknown routes (no registered methods)', () => {
    const router = createMockRouter([]);

    discoverRoutes('/prefix', router);

    const handler = createMethodNotAllowedHandler();
    const req = {
      originalUrl: '/prefix/unknown',
      method: 'DELETE',
      path: '/unknown',
    };
    const next = vi.fn();
    handler(req as never, {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });
});

function createMethodNotAllowedHandler() {
  return methodNotAllowedHandler;
}
