import { z } from 'zod';
import { addDays, addWeeks, addMonths, addYears, isValid } from 'date-fns';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().int().positive('Amount must be a positive integer'),
  currency: z.string().default('INR'),
  billingCycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  intervalCount: z.number().int().positive().default(1),
  nextBillingDate: z.string().transform((val) => new Date(val)),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().int().positive().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
  intervalCount: z.number().int().positive().optional(),
  nextBillingDate: z.string().transform((val) => new Date(val)).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'cancelled', 'expired']).optional(),
});

export const subscriptionIdSchema = z.object({
  id: z.string().uuid('Invalid subscription ID'),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionIdInput = z.infer<typeof subscriptionIdSchema>;

export function calculateNextBillingDate(currentDate: Date, billingCycle: string, intervalCount: number): Date {
  switch (billingCycle) {
    case 'daily':
      return addDays(currentDate, intervalCount);
    case 'weekly':
      return addWeeks(currentDate, intervalCount);
    case 'monthly':
      return addMonths(currentDate, intervalCount);
    case 'quarterly':
      return addMonths(currentDate, intervalCount * 3);
    case 'yearly':
      return addYears(currentDate, intervalCount);
    case 'custom':
      return addDays(currentDate, intervalCount * 30);
    default:
      return addMonths(currentDate, 1);
  }
}