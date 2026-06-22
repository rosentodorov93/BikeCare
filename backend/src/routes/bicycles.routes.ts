import { Router } from 'express';
import {
  createBicycle,
  createBicycleSchema,
  deleteBicycle,
  getBicycle,
  getBicycleReport,
  listBicycles,
  updateBicycle,
  updateBicycleSchema,
} from '../controllers/bicycles.controller.js';
import {
  listComponentsForBike,
  resetComponentService,
  updateComponentSchema,
  updateComponentService,
} from '../controllers/components.controller.js';
import { validateBody } from '../middleware/validate.js';

export const bicyclesRouter = Router();

bicyclesRouter.get('/', listBicycles);
bicyclesRouter.get('/:id', getBicycle);
bicyclesRouter.get('/:id/report', getBicycleReport);
bicyclesRouter.get('/:id/components', listComponentsForBike);
bicyclesRouter.post('/:id/components/:componentId/reset', resetComponentService);
bicyclesRouter.patch(
  '/:id/components/:componentId',
  validateBody(updateComponentSchema),
  updateComponentService,
);
bicyclesRouter.post('/', validateBody(createBicycleSchema), createBicycle);
bicyclesRouter.put('/:id', validateBody(updateBicycleSchema), updateBicycle);
bicyclesRouter.delete('/:id', deleteBicycle);
