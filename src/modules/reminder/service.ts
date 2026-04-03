import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../shared/utils/database';
import { logger } from '../../shared/utils/logger';
import { NotFoundError, ValidationError } from '../../shared/errors';
import type { CreateReminderInput, UpdateReminderInput } from './validations';
import type { ReminderStatus } from '../../shared/types';

export async function createReminder(userId: string, input: CreateReminderInput) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: input.subscriptionId, userId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  if (input.scheduledAt < new Date()) {
    throw new ValidationError('Scheduled time must be in the future');
  }

  const reminder = await prisma.reminder.create({
    data: {
      id: uuidv4(),
      subscriptionId: input.subscriptionId,
      reminderType: input.reminderType,
      daysOffset: input.daysOffset,
      scheduledAt: input.scheduledAt,
    },
  });

  logger.info(`Reminder created: ${reminder.id} for subscription: ${input.subscriptionId}`);
  return reminder;
}

export async function getReminders(userId: string, subscriptionId?: string) {
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
    where.subscription = {
      userId,
    };
  }

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      subscription: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return reminders;
}

export async function getReminderById(reminderId: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      subscription: { userId },
    },
    include: {
      subscription: true,
    },
  });

  if (!reminder) {
    throw new NotFoundError('Reminder');
  }

  return reminder;
}

export async function updateReminder(reminderId: string, userId: string, input: UpdateReminderInput) {
  await getReminderById(reminderId, userId);

  if (input.scheduledAt && input.scheduledAt < new Date()) {
    throw new ValidationError('Scheduled time must be in the future');
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: input,
  });

  logger.info(`Reminder updated: ${reminderId}`);
  return updated;
}

export async function deleteReminder(reminderId: string, userId: string) {
  await getReminderById(reminderId, userId);

  await prisma.reminder.delete({
    where: { id: reminderId },
  });

  logger.info(`Reminder deleted: ${reminderId}`);
}

export async function getPendingReminders(): Promise<Array<{
  id: string;
  subscriptionId: string;
  reminderType: string;
  scheduledAt: Date;
  subscription: {
    id: string;
    userId: string;
    name: string;
    amount: number;
    currency: string;
    nextBillingDate: Date;
  };
}>> {
  return prisma.reminder.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: new Date() },
    },
    include: {
      subscription: {
        select: {
          id: true,
          userId: true,
          name: true,
          amount: true,
          currency: true,
          nextBillingDate: true,
        },
      },
    },
  });
}

export async function markReminderAsSent(reminderId: string): Promise<void> {
  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent' as ReminderStatus,
      sentAt: new Date(),
    },
  });
}

export async function markReminderAsFailed(reminderId: string): Promise<void> {
  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      status: 'failed' as ReminderStatus,
    },
  });
}

export async function createRemindersForSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  const reminderConfigs = [
    { reminderType: 'pre_reminder' as const, daysOffset: 3 },
    { reminderType: 'pre_reminder' as const, daysOffset: 1 },
    { reminderType: 'on_due' as const, daysOffset: 0 },
  ];

  for (const config of reminderConfigs) {
    const scheduledAt = new Date(subscription.nextBillingDate);
    scheduledAt.setDate(scheduledAt.getDate() - config.daysOffset);

    if (scheduledAt > new Date()) {
      await prisma.reminder.create({
        data: {
          id: uuidv4(),
          subscriptionId,
          reminderType: config.reminderType,
          daysOffset: config.daysOffset,
          scheduledAt,
        },
      });
    }
  }

  logger.info(`Created reminders for subscription: ${subscriptionId}`);
}