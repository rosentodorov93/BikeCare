import type { NextFunction, Request, Response } from 'express';

// Wrap an async route handler so a thrown/rejected error always reaches the
// central error handler instead of crashing or hanging the request.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
