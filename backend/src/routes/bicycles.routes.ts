import { Router } from 'express';
import {
  createBicycle,
  createBicycleSchema,
  deleteBicycle,
  getBicycle,
  listBicycles,
  updateBicycle,
  updateBicycleSchema,
} from '../controllers/bicycles.controller.js';
import { listComponentsForBike } from '../controllers/components.controller.js';
import { validateBody } from '../middleware/validate.js';

export const bicyclesRouter = Router();

bicyclesRouter.get('/', listBicycles);
bicyclesRouter.get('/:id', getBicycle);
bicyclesRouter.get('/:id/components', listComponentsForBike);
bicyclesRouter.post('/', validateBody(createBicycleSchema), createBicycle);
bicyclesRouter.put('/:id', validateBody(updateBicycleSchema), updateBicycle);
bicyclesRouter.delete('/:id', deleteBicycle);
