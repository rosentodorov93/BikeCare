import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { dashboardService } from '../services/dashboard.service.js';
import { DASHBOARD_PERIODS } from '../types/dashboard.js';
import { ok } from '../utils/api-response.js';

// The period query param drives the date-range-sensitive figures. It defaults
// to the current month and falls back to it for any unrecognised value.
const periodSchema = z.enum(DASHBOARD_PERIODS).catch('month');

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const period = periodSchema.parse(req.query.period);
  const data = await dashboardService.getDashboard(period);
  res.json(ok(data));
});
