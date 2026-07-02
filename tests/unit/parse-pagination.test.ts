import { describe, it, expect } from 'vitest';
import {
  parsePagination,
  paginate,
  clampLimit,
  offset,
} from '#common/helpers/pagination';
import type { Request } from 'express';

function mockReq(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

describe('parsePagination', () => {
  it('returns defaults when no query params provided', () => {
    const result = parsePagination(mockReq({}));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it('parses page and limit from string query params', () => {
    const result = parsePagination(mockReq({ page: '3', limit: '10' }));
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });

  it('clamps limit to max 100', () => {
    const result = parsePagination(mockReq({ limit: '999' }));
    expect(result.limit).toBe(100);
  });

  it('clamps page to minimum 1', () => {
    const result = parsePagination(mockReq({ page: '-5' }));
    expect(result.page).toBe(1);
  });

  it('handles page of 0 gracefully', () => {
    const result = parsePagination(mockReq({ page: '0' }));
    expect(result.page).toBe(1);
  });

  it('handles non-numeric page string', () => {
    const result = parsePagination(mockReq({ page: 'abc' }));
    expect(result.page).toBe(1);
  });

  it('returns custom defaults when provided', () => {
    const result = parsePagination(mockReq({}), { page: 2, limit: 50 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('accepts numeric query values (plainToInstance result)', () => {
    const result = parsePagination(mockReq({ page: 2, limit: 15 }));
    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
  });
});

describe('paginate', () => {
  it('calculates totalPages correctly', () => {
    const result = paginate(100, 1, 20);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalCount).toBe(100);
    expect(result.totalPages).toBe(5);
  });

  it('rounds up partial pages', () => {
    expect(paginate(101, 1, 20).totalPages).toBe(6);
  });

  it('handles zero totalCount', () => {
    expect(paginate(0, 1, 20).totalPages).toBe(0);
  });
});

describe('clampLimit', () => {
  it('returns value within bounds', () => {
    expect(clampLimit(50)).toBe(50);
  });

  it('clamps to min', () => {
    expect(clampLimit(-5)).toBe(1);
  });

  it('clamps to max', () => {
    expect(clampLimit(999)).toBe(100);
  });

  it('respects custom bounds', () => {
    expect(clampLimit(5, 3, 10)).toBe(5);
    expect(clampLimit(1, 3, 10)).toBe(3);
    expect(clampLimit(20, 3, 10)).toBe(10);
  });
});

describe('offset', () => {
  it('calculates offset correctly', () => {
    expect(offset(1, 20)).toBe(0);
    expect(offset(2, 20)).toBe(20);
    expect(offset(5, 10)).toBe(40);
  });
});
