import { Router } from 'express';
import { login, loginSchema, register, registerSchema } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
