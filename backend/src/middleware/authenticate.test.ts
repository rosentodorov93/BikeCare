import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

vi.mock('../config/env.js', () => ({ JWT_SECRET: 'test-secret' }));

import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-response.js';
import { authenticate } from './authenticate.js';

function makeReq(authorization?: string): Request {
  return { headers: { authorization }, userId: undefined } as unknown as Request;
}

const res = {} as Response;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticate', () => {
  it('throws ApiError(401) when the Authorization header is missing', () => {
    const next = vi.fn() as NextFunction;
    expect(() => authenticate(makeReq(undefined), res, next)).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws ApiError(401) when the header does not start with "Bearer "', () => {
    const next = vi.fn() as NextFunction;
    let caught: unknown;
    try {
      authenticate(makeReq('Basic abc123'), res, next);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(401);
    expect((caught as ApiError).code).toBe('UNAUTHORIZED');
    expect(next).not.toHaveBeenCalled();
  });

  it('throws ApiError(401) when the token is invalid or expired', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const next = vi.fn() as NextFunction;
    let caught: unknown;
    try {
      authenticate(makeReq('Bearer bad-token'), res, next);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(401);
    expect((caught as ApiError).code).toBe('UNAUTHORIZED');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.userId from the token payload and calls next() on a valid token', () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-1' } as never);
    const req = makeReq('Bearer good-token');
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('good-token', 'test-secret');
    expect(req.userId).toBe('user-1');
    expect(next).toHaveBeenCalledWith();
  });
});
