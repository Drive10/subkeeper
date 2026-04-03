import { Router, Response, NextFunction } from 'express';
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  pauseSubscription,
  resumeSubscription,
  getUpcomingRenewals,
} from './service';
import { createSubscriptionSchema, updateSubscriptionSchema, subscriptionIdSchema } from './validations';
import { validate } from '../../shared/middleware/validation';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import type { SubscriptionStatus } from '../../shared/types';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createSubscriptionSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscription = await createSubscription(req.user!.id, req.body);
      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, category } = req.query;
      const subscriptions = await getSubscriptions(req.user!.id, {
        status: status as SubscriptionStatus | undefined,
        category: category as string | undefined,
      });
      res.json(subscriptions);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/upcoming',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const upcoming = await getUpcomingRenewals(req.user!.id, days);
      res.json(upcoming);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  validate(subscriptionIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscription = await getSubscriptionById(req.params.id, req.user!.id);
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  validate(subscriptionIdSchema, 'params'),
  validate(updateSubscriptionSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscription = await updateSubscription(req.params.id, req.user!.id, req.body);
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  validate(subscriptionIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteSubscription(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/pause',
  validate(subscriptionIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscription = await pauseSubscription(req.params.id, req.user!.id);
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/resume',
  validate(subscriptionIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscription = await resumeSubscription(req.params.id, req.user!.id);
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  }
);

export default router;