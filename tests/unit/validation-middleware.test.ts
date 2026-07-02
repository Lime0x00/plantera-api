import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ValidationError } from '#common/errors';

vi.mock('class-transformer', () => ({
  plainToInstance: vi.fn(
    (_dtoClass: new () => object, plain: unknown) => plain
  ),
}));

vi.mock('class-validator', () => ({
  validate: vi.fn(),
}));

vi.mock('#common/types/index', () => ({
  API_MESSAGES: {
    register: { '422': 'Validation failed for register.' },
    login: { '422': 'Validation failed for login.' },
  },
}));

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  validateDto,
  validateQuery,
} from '#framework/middleware/validation.middleware';

function mockReqRes(overrides: Record<string, unknown> = {}) {
  const req = {
    originalUrl: '/api/v1/auth/register',
    body: {},
    query: {},
    path: '/auth/register',
    ...overrides,
  };
  const res = {};
  const next = vi.fn();
  return { req, res, next };
}

describe('validateDto', () => {
  beforeAll(() => {
    vi.mocked(validate).mockResolvedValue([]);
  });

  it('calls next() when validation passes', async () => {
    const { req, res, next } = mockReqRes();
    const middleware = validateDto(class {});
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('assigns transformed body to req.body on success', async () => {
    const dtoInstance = { email: 'test@test.com' };
    vi.mocked(plainToInstance).mockReturnValueOnce(dtoInstance);
    const { req, res, next } = mockReqRes();
    const middleware = validateDto(class {});
    await middleware(req as never, res as never, next);

    expect(req.body).toBe(dtoInstance);
  });

  it('calls next with ValidationError when validation fails', async () => {
    vi.mocked(validate).mockResolvedValueOnce([
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
      },
    ]);

    const { req, res, next } = mockReqRes();
    const middleware = validateDto(class {});
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('includes correct error details on validation failure', async () => {
    vi.mocked(validate).mockResolvedValueOnce([
      {
        property: 'password',
        constraints: { minLength: 'password must be at least 8 characters' },
      },
    ]);

    const { req, res, next } = mockReqRes();
    const middleware = validateDto(class {});
    await middleware(req as never, res as never, next);

    const error = next.mock.calls[0][0] as ValidationError & {
      details: Record<string, { code: string; message: string }>;
    };
    expect(error.details).toHaveProperty('password');
    expect(error.details.password).toHaveProperty('code', 'TOO_SHORT');
    expect(error.details.password).toHaveProperty(
      'message',
      'password must be at least 8 characters'
    );
  });

  it('provides a default message when operation is not in OPERATION_MAP', async () => {
    vi.mocked(validate).mockResolvedValueOnce([
      {
        property: 'name',
        constraints: { isNotEmpty: 'name should not be empty' },
      },
    ]);

    const { req, res, next } = mockReqRes({ originalUrl: '/api/v1/unknown' });
    const middleware = validateDto(class {});
    await middleware(req as never, res as never, next);

    const error = next.mock.calls[0][0] as ValidationError & {
      message: string;
    };
    expect(error.message).toBe('Validation failed for request details.');
  });
});

describe('validateQuery', () => {
  beforeAll(() => {
    vi.mocked(validate).mockResolvedValue([]);
  });

  it('calls next() when validation passes', async () => {
    const { req, res, next } = mockReqRes({ query: { page: '1' } });
    const middleware = validateQuery(class {});
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('assigns validated query to req.validatedQuery on success', async () => {
    const dtoInstance = { page: 1, limit: 20 };
    vi.mocked(plainToInstance).mockReturnValueOnce(dtoInstance);
    const { req, res, next } = mockReqRes({
      query: { page: '1', limit: '20' },
      validatedQuery: undefined,
    });
    const middleware = validateQuery(class {});
    await middleware(req as never, res as never, next);

    expect((req as Record<string, unknown>).validatedQuery).toBe(dtoInstance);
  });

  it('calls next with ValidationError when validation fails', async () => {
    vi.mocked(validate).mockResolvedValueOnce([
      {
        property: 'page',
        constraints: { isInt: 'page must be an integer' },
      },
    ]);

    const { req, res, next } = mockReqRes();
    const middleware = validateQuery(class {});
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('provides a default message for unknown routes', async () => {
    vi.mocked(validate).mockResolvedValueOnce([
      {
        property: 'type',
        constraints: { isString: 'type must be a string' },
      },
    ]);

    const { req, res, next } = mockReqRes({
      originalUrl: '/api/v1/unknown?type=123',
    });
    const middleware = validateQuery(class {});
    await middleware(req as never, res as never, next);

    const error = next.mock.calls[0][0] as ValidationError & {
      message: string;
    };
    expect(error.message).toBe('Validation failed for query parameters.');
  });
});
