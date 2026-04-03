import { z } from 'zod';

export const createPaymentSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  paymentDate: z.string().transform((val) => new Date(val)),
  source: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
});

export const paymentIdSchema = z.object({
  id: z.string().uuid('Invalid payment ID'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentIdInput = z.infer<typeof paymentIdSchema>;