import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { componentService } from '../services/components.service.js';
import { ok } from '../utils/api-response.js';

// Request DTO for adjusting a component's service interval.
export const updateComponentSchema = z.object({
  serviceIntervalKm: z.coerce.number().positive('must be greater than 0'),
});

// List the components fitted to a bike, each with wear computed from the bike's
// accumulated distance. The service raises a 404 when the bike id is unknown.
export const listComponentsForBike = asyncHandler(async (req: Request, res: Response) => {
  const components = await componentService.getByBikeId(req.params.id, req.userId!);
  res.json(ok(components));
});

// Reset a component's service (mark it replaced/serviced) — wear returns to 0.
export const resetComponentService = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentService.resetService(
    req.params.id,
    req.params.componentId,
    req.userId!,
  );
  res.json(ok(component));
});

// Adjust a component's service interval (km between services); wear is recomputed.
export const updateComponentService = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentService.updateServiceInterval(
    req.params.id,
    req.params.componentId,
    req.body.serviceIntervalKm,
    req.userId!,
  );
  res.json(ok(component));
});
