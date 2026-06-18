import { Router } from 'express';
import {
  createActivity,
  createActivitySchema,
  listActivities,
} from '../controllers/activities.controller.js';
import { validateBody } from '../middleware/validate.js';

export const activitiesRouter = Router();

activitiesRouter.get('/', listActivities);
activitiesRouter.post('/', validateBody(createActivitySchema), createActivity);
