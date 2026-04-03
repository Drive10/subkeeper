import { z } from 'zod';

export const createReminderSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  reminderType: z.enum(['pre_reminder', 'on_due', 'overdue']),
  daysOffset: z.number().int().min(0).max(365),
  scheduledAt: z.string().transform((val) => new Date(val)),
});

export const updateReminderSchema = z.object({
  scheduledAt: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
});

export const reminderIdSchema = z.object({
  id: z.string().uuid('Invalid reminder ID'),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type ReminderIdInput = z.infer<typeof reminderIdSchema>;