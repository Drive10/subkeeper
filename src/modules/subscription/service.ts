import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../shared/utils/database';
import { logger } from '../../shared/utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/errors';
import { calculateNextBillingDate } from './validations';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from './validations';
import type { BillingCycle, SubscriptionStatus } from '../../shared/types';

export async function createSubscription(userId: string, input: CreateSubscriptionInput) {
  const { name, amount, currency, billingCycle, intervalCount, nextBillingDate, category, description } = input;

  if (nextBillingDate < new Date()) {
    throw new ValidationError('Next billing date must be in the future');
  }

  const subscription = await prisma.subscription.create({
    data: {
      id: uuidv4(),
      userId,
      name,
      amount,
      currency,
      billingCycle: billingCycle as BillingCycle,
      intervalCount,
      nextBillingDate,
      category,
      description,
      status: 'active' as SubscriptionStatus,
    },
  });

  logger.info(`Subscription created: ${subscription.id} for user: ${userId}`);
  return subscription;
}

export async function getSubscriptions(userId: string, filters?: { status?: SubscriptionStatus; category?: string }) {
  const where: Record<string, unknown> = { userId };
  
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.category) {
    where.category = filters.category;
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { nextBillingDate: 'asc' },
  });

  return subscriptions;
}

export async function getSubscriptionById(subscriptionId: string, userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  return subscription;
}

export async function updateSubscription(subscriptionId: string, userId: string, input: UpdateSubscriptionInput) {
  const existing = await getSubscriptionById(subscriptionId, userId);

  if (input.nextBillingDate && input.nextBillingDate < new Date()) {
    throw new ValidationError('Next billing date must be in the future');
  }

  if (input.amount && input.amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: input,
  });

  logger.info(`Subscription updated: ${subscriptionId}`);
  return updated;
}

export async function deleteSubscription(subscriptionId: string, userId: string) {
  await getSubscriptionById(subscriptionId, userId);

  await prisma.subscription.delete({
    where: { id: subscriptionId },
  });

  logger.info(`Subscription deleted: ${subscriptionId}`);
}

export async function pauseSubscription(subscriptionId: string, userId: string) {
  await getSubscriptionById(subscriptionId, userId);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'paused' as SubscriptionStatus },
  });

  logger.info(`Subscription paused: ${subscriptionId}`);
  return updated;
}

export async function resumeSubscription(subscriptionId: string, userId: string) {
  const subscription = await getSubscriptionById(subscriptionId, userId);

  if (subscription.status !== 'paused') {
    throw new ValidationError('Can only resume paused subscriptions');
  }

  const nextBillingDate = calculateNextBillingDate(new Date(), subscription.billingCycle, subscription.intervalCount);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'active' as SubscriptionStatus,
      nextBillingDate,
    },
  });

  logger.info(`Subscription resumed: ${subscriptionId}`);
  return updated;
}

export async function getUpcomingRenewals(userId: string, days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: 'active',
      nextBillingDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    orderBy: { nextBillingDate: 'asc' },
  });

  return subscriptions;
}

export async function getActiveSubscriptionsCount(userId: string): Promise<number> {
  return prisma.subscription.count({
    where: { userId, status: 'active' },
  });
}