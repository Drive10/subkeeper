import { Router, Request, Response, NextFunction } from 'express';
import {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from './service';
import { createReminderSchema, updateReminderSchema, reminderIdSchema } from './validations';
import { validate } from '../../shared/middleware/validation';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createReminderSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reminder = await createReminder(req.user!.id, req.body);
      res.status(201).json(reminder);
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
      const reminders = await getReminders(req.user!.id, subscriptionId as string);
      res.json(reminders);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  validate(reminderIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reminder = await getReminderById(req.params.id, req.user!.id);
      res.json(reminder);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  validate(reminderIdSchema, 'params'),
  validate(updateReminderSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reminder = await updateReminder(req.params.id, req.user!.id, req.body);
      res.json(reminder);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  validate(reminderIdSchema, 'params'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteReminder(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;