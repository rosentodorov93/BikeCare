import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { bicyclesRouter } from './routes/bicycles.routes.js';
import { ApiError } from './utils/api-response.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.use('/api/bicycles', bicyclesRouter);

// Unknown /api route -> 404 in the standard envelope.
app.use('/api', (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'Resource not found'));
});

// Central error handler, registered last.
app.use(errorHandler);
