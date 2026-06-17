import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/api-response.js';

// The single place that turns an error into an HTTP response.
// Registered last in app.ts.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  console.error(err);
  res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
