import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../utils/api-response.js';
import { errorHandler } from './error-handler.js';

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, _json: json } as unknown as Response & {
    status: typeof status;
    _json: typeof json;
  };
}

const req = {} as Request;
const next = vi.fn() as NextFunction;

describe('errorHandler', () => {
  it('responds with the ApiError status and body', () => {
    const res = makeRes();
    const err = new ApiError(422, 'UNPROCESSABLE', 'Bad data');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res._json).toHaveBeenCalledWith({
      error: { code: 'UNPROCESSABLE', message: 'Bad data' },
    });
  });

  it('responds 404 for a NOT_FOUND ApiError', () => {
    const res = makeRes();
    const err = new ApiError(404, 'BICYCLE_NOT_FOUND', 'Bicycle abc not found');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res._json).toHaveBeenCalledWith({
      error: { code: 'BICYCLE_NOT_FOUND', message: 'Bicycle abc not found' },
    });
  });

  it('responds 500 INTERNAL_ERROR for unknown errors', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res._json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
