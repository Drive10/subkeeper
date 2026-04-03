import { Router, Request, Response, NextFunction } from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from './service';
import { createPaymentSchema, updatePaymentSchema, paymentIdSchema } from './validations';
import { validate } from '../../shared/middleware/validation';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createPaymentSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const payment = await createPayment(req.user!.id, req.body);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { subscriptionId } = req.query;
      const payments = await getPayments(req.user!.id, subscriptionId as string);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  validate(paymentIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const payment = await getPaymentById(req.params.id, req.user!.id);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  validate(paymentIdSchema, 'params'),
  validate(updatePaymentSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const payment = await updatePayment(req.params.id, req.user!.id, req.body);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  validate(paymentIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deletePayment(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;