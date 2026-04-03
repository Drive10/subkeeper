import { Router, Request, Response, NextFunction } from 'express';
import {
  getMonthlySpend,
  getCategoryBreakdown,
  getSubscriptionStats,
  getUpcomingRenewals,
  getTotalMonthlySpend,
  getUnusedSubscriptions,
} from './service';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/monthly-spend',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await getMonthlySpend(req.user!.id, months);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/category-breakdown',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await getCategoryBreakdown(req.user!.id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/subscription-stats',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await getSubscriptionStats(req.user!.id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/upcoming-renewals',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await getUpcomingRenewals(req.user!.id, days);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/total-monthly-spend',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await getTotalMonthlySpend(req.user!.id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/unused-subscriptions',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await getUnusedSubscriptions(req.user!.id, days);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;