import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { bicycleService } from '../services/bicycles.service.js';
import { componentService } from '../services/components.service.js';
import { ok } from '../utils/api-response.js';

// List the components fitted to a bike. Resolving the bike first gives a clean
// 404 (via the service's not-found rule) when the bike id is unknown.
export const listComponentsForBike = asyncHandler(async (req: Request, res: Response) => {
  await bicycleService.getById(req.params.id);
  const components = await componentService.getByBikeId(req.params.id);
  res.json(ok(components));
});
