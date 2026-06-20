import { describe, expect, it } from 'vitest';
import { ApiError, ok } from './api-response.js';

describe('ok', () => {
  it('wraps value in a data envelope', () => {
    expect(ok({ foo: 1 })).toEqual({ data: { foo: 1 } });
  });

  it('wraps null', () => {
    expect(ok(null)).toEqual({ data: null });
  });

  it('wraps arrays', () => {
    expect(ok([1, 2, 3])).toEqual({ data: [1, 2, 3] });
  });
});

describe('ApiError', () => {
  it('sets status, code, and message', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Not found');
  });

  it('is an instance of Error', () => {
    expect(new ApiError(500, 'ERR', 'msg')).toBeInstanceOf(Error);
  });

  it('has name ApiError', () => {
    expect(new ApiError(400, 'ERR', 'msg').name).toBe('ApiError');
  });

  it('accepts any HTTP status code', () => {
    expect(new ApiError(422, 'UNPROCESSABLE', 'bad').status).toBe(422);
  });
});
