import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { authService } from '../services/auth.service.js';
import { ok } from '../utils/api-response.js';

// Request DTOs (co-located with the controller that uses them).
export const registerSchema = z.object({
  username: z.string().trim().min(3, 'must be at least 3 characters').max(30, 'must be at most 30 characters'),
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(8, 'must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(1, 'is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterDto);
  res.status(201).json(ok(result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginDto);
  res.json(ok(result));
});
