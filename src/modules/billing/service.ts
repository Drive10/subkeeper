import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../shared/utils/database';
import { logger } from '../../shared/utils/logger';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { calculateNextBillingDate } from '../subscription/validations';
import type { CreatePaymentInput, UpdatePaymentInput } from './validations';
import type { PaymentStatus, BillingCycle } from '../../shared/types';

export async function createPayment(userId: string, input: CreatePaymentInput) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: input.subscriptionId, userId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  if (input.amount !== subscription.amount) {
    logger.warn(`Payment amount ${input.amount} differs from subscription amount ${subscription.amount}`);
  }

  const payment = await prisma.payment.create({
    data: {
      id: uuidv4(),
      subscriptionId: input.subscriptionId,
      userId,
      amount: input.amount,
      currency: input.currency,
      paymentDate: input.paymentDate,
      source: input.source,
      status: 'completed' as PaymentStatus,
    },
  });

  await prisma.subscription.update({
    where: { id: input.subscriptionId },
    data: {
      lastBillingDate: input.paymentDate,
      nextBillingDate: calculateNextBillingDate(
        input.paymentDate,
        subscription.billingCycle as BillingCycle,
        subscription.intervalCount
      ),
    },
  });

  logger.info(`Payment recorded: ${payment.id} for subscription: ${input.subscriptionId}`);
  return payment;
}

export async function getPayments(userId: string, subscriptionId?: string) {
  const where: Record<string, unknown> = {};

  if (subscriptionId) {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundError('Subscription');
    }
    where.subscriptionId = subscriptionId;
  } else {
    where.subscription = { userId };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      subscription: {
        select: { id: true, name: true },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });

  return payments;
}

export async function getPaymentById(paymentId: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      subscription: { userId },
    },
    include: {
      subscription: true,
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  return payment;
}

export async function updatePayment(paymentId: string, userId: string, input: UpdatePaymentInput) {
  await getPaymentById(paymentId, userId);

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: input,
  });

  logger.info(`Payment updated: ${paymentId}`);
  return updated;
}

export async function deletePayment(paymentId: string, userId: string) {
  await getPaymentById(paymentId, userId);

  await prisma.payment.delete({
    where: { id: paymentId },
  });

  logger.info(`Payment deleted: ${paymentId}`);
}

export async function getPaymentsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentDate: Date;
  subscription: { id: string; name: string };
}>> {
  return prisma.payment.findMany({
    where: {
      subscription: { userId },
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    include: {
      subscription: {
        select: { id: true, name: true },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });
}