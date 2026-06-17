import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/api-response.js';

// Parse and replace req.body with the validated/typed result. On failure, throw
// an ApiError(400) so the central error handler shapes the response.
export const validateBody =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ');
      throw new ApiError(400, 'VALIDATION_ERROR', message);
    }
    req.body = result.data;
    next();
  };
