import { z } from 'zod';

export const detectSmsSchema = z.object({
  text: z.string().min(1, 'Text is required').max(1000),
});

export const detectEmailSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required').max(5000),
});

export const confirmDetectionSchema = z.object({
  detectionLogId: z.string().uuid('Invalid detection log ID'),
  confirmed: z.boolean(),
  name: z.string().optional(),
  amount: z.number().optional(),
  billingCycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
});

export type DetectSmsInput = z.infer<typeof detectSmsSchema>;
export type DetectEmailInput = z.infer<typeof detectEmailSchema>;
export type ConfirmDetectionInput = z.infer<typeof confirmDetectionSchema>;