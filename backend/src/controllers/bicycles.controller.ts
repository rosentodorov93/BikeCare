import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { bicycleService } from '../services/bicycles.service.js';
import { BICYCLE_TYPES, WHEEL_SIZES } from '../types/bicycle.js';
import { COMPONENT_LIST_TYPES } from '../types/component.js';
import { ok } from '../utils/api-response.js';

// Request DTOs (co-located with the controller that uses them). An empty string
// for the optional fields is normalised to null so the form's "cleared" value
// is stored consistently.
const emptyToNull = (v: unknown) => (v === '' ? null : v);

const bicycleFields = {
  name: z.string().trim().min(1, 'is required'),
  brand: z.string().trim().min(1, 'is required'),
  model: z.string().trim().min(1, 'is required'),
  type: z.enum(BICYCLE_TYPES),
  purchaseDate: z.preprocess(emptyToNull, z.string().date().nullable().default(null)),
  frameSize: z.preprocess(emptyToNull, z.string().trim().min(1).nullable().default(null)),
  wheelSize: z.preprocess(emptyToNull, z.enum(WHEEL_SIZES).nullable().default(null)),
};

// `componentListType` only drives component creation, so it lives on the create
// schema. Edits never regenerate components, so the update schema omits it.
export const createBicycleSchema = z.object({
  ...bicycleFields,
  componentListType: z.enum(COMPONENT_LIST_TYPES).default('no_suspension'),
});

export const updateBicycleSchema = z.object(bicycleFields);

export type CreateBicycleDto = z.infer<typeof createBicycleSchema>;
export type UpdateBicycleDto = z.infer<typeof updateBicycleSchema>;

export const listBicycles = asyncHandler(async (_req: Request, res: Response) => {
  const bicycles = await bicycleService.getAll();
  res.json(ok(bicycles));
});

export const getBicycle = asyncHandler(async (req: Request, res: Response) => {
  const bicycle = await bicycleService.getById(req.params.id);
  res.json(ok(bicycle));
});

export const createBicycle = asyncHandler(async (req: Request, res: Response) => {
  const bicycle = await bicycleService.create(req.body as CreateBicycleDto);
  res.status(201).json(ok(bicycle));
});

export const updateBicycle = asyncHandler(async (req: Request, res: Response) => {
  const bicycle = await bicycleService.update(req.params.id, req.body as UpdateBicycleDto);
  res.json(ok(bicycle));
});

export const deleteBicycle = asyncHandler(async (req: Request, res: Response) => {
  await bicycleService.remove(req.params.id);
  res.status(204).send();
});
