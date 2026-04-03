import { Router, Request, Response, NextFunction } from 'express';
import { register, login, refreshAccessToken, logout } from './service';
import { registerSchema, loginSchema, refreshTokenSchema } from './validations';
import { validate } from '../../shared/middleware/validation';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { logger } from '../../shared/utils/logger';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await refreshAccessToken(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/logout',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refreshToken;
      await logout(req.user!.id, refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json(req.user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;