import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError } from '../utils/api-response.js';
import { validateBody } from './validate.js';

const schema = z.object({ name: z.string(), age: z.number() });

function makeReq(body: unknown): Request {
  return { body } as Request;
}

const res = {} as Response;

describe('validateBody', () => {
  it('calls next() with no arguments and replaces req.body when valid', () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ name: 'Alice', age: 30 });
    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws ApiError(400) when body is invalid', () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ name: 'Alice' }); // missing age
    expect(() => validateBody(schema)(req, res, next)).toThrow(ApiError);
  });

  it('thrown ApiError has code VALIDATION_ERROR and status 400', () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({});
    let caught: unknown;
    try {
      validateBody(schema)(req, res, next);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const apiErr = caught as ApiError;
    expect(apiErr.code).toBe('VALIDATION_ERROR');
    expect(apiErr.status).toBe(400);
  });

  it('error message includes the failing field path', () => {
    const next = vi.fn() as NextFunction;
    const req = makeReq({ name: 'Alice' }); // age missing
    let caught: ApiError | undefined;
    try {
      validateBody(schema)(req, res, next);
    } catch (err) {
      caught = err as ApiError;
    }
    expect(caught?.message).toContain('age');
  });
});
