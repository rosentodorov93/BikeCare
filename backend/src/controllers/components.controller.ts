import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { componentService } from '../services/components.service.js';
import { ok } from '../utils/api-response.js';

// List the components fitted to a bike, each with wear computed from the bike's
// accumulated distance. The service raises a 404 when the bike id is unknown.
export const listComponentsForBike = asyncHandler(async (req: Request, res: Response) => {
  const components = await componentService.getByBikeId(req.params.id);
  res.json(ok(components));
});

// Reset a component's service (mark it replaced/serviced) — wear returns to 0.
export const resetComponentService = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentService.resetService(req.params.id, req.params.componentId);
  res.json(ok(component));
});
