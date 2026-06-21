import cors from 'cors';
import express from 'express';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/error-handler.js';
import { activitiesRouter } from './routes/activities.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { bicyclesRouter } from './routes/bicycles.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { ApiError } from './utils/api-response.js';

export const app = express();

app.use(cors());
// Raised from the 100kb default so downscaled image data URLs fit in the body.
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.use('/api/auth', authRouter);
app.use('/api/bicycles', authenticate, bicyclesRouter);
app.use('/api/activities', authenticate, activitiesRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);

// Unknown /api route -> 404 in the standard envelope.
app.use('/api', (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'Resource not found'));
});

// Central error handler, registered last.
app.use(errorHandler);
