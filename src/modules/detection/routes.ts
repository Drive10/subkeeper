import { Router, Response, NextFunction } from 'express';
import {
  detectFromSms,
  detectFromEmail,
  confirmDetection,
  getDetectionLogs,
  getDetectionLogById,
} from './service';
import { detectSmsSchema, detectEmailSchema, confirmDetectionSchema } from './validations';
import { validate } from '../../shared/middleware/validation';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import type { DetectionStatus } from '../../shared/types';

const router = Router();

router.use(authenticate);

router.post(
  '/sms',
  validate(detectSmsSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await detectFromSms(req.user!.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/email',
  validate(detectEmailSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await detectFromEmail(req.user!.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/confirm',
  validate(confirmDetectionSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await confirmDetection(req.user!.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/logs',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const logs = await getDetectionLogs(req.user!.id, status as DetectionStatus | undefined);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/logs/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const log = await getDetectionLogById(req.params.id, req.user!.id);
      res.json(log);
    } catch (error) {
      next(error);
    }
  }
);

export default router;