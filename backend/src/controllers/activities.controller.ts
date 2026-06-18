import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { activityService } from '../services/activities.service.js';
import { ok } from '../utils/api-response.js';

// Request DTO (co-located with the controller that uses it).
export const createActivitySchema = z.object({
  bikeId: z.string().trim().min(1, 'is required'),
  date: z.string().date(),
  distanceKm: z.coerce.number().positive('must be greater than 0'),
});

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const listActivities = asyncHandler(async (_req: Request, res: Response) => {
  const activities = await activityService.getAll();
  res.json(ok(activities));
});

export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await activityService.create(req.body as CreateActivityDto);
  res.status(201).json(ok(activity));
});
