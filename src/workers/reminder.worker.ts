import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../shared/utils/redis';
import { logger } from '../shared/utils/logger';
import { getPendingReminders, markReminderAsSent, markReminderAsFailed } from '../modules/reminder/service';

interface ReminderJobData {
  reminderId: string;
  subscriptionId: string;
  userId: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  nextBillingDate: Date;
  reminderType: string;
}

async function sendNotification(data: ReminderJobData): Promise<void> {
  logger.info(`Sending ${data.reminderType} reminder to user ${data.userId} for ${data.subscriptionName}`);
  
  console.log(`
========================================
🔔 REMINDER NOTIFICATION
========================================
Subscription: ${data.subscriptionName}
Amount: ${data.currency} ${data.amount}
Next Billing: ${new Date(data.nextBillingDate).toLocaleDateString()}
Type: ${data.reminderType}
========================================
  `);

  await new Promise((resolve) => setTimeout(resolve, 100));
}

export async function startReminderWorker(): Promise<Worker> {
  const connection = getRedisClient();

  const worker = new Worker<ReminderJobData>(
    'reminder-queue',
    async (job: Job<ReminderJobData>) => {
      try {
        await sendNotification(job.data);
        await markReminderAsSent(job.data.reminderId);
        logger.info(`Reminder ${job.data.reminderId} sent successfully`);
      } catch (error) {
        logger.error(`Failed to send reminder ${job.data.reminderId}:`, error);
        await markReminderAsFailed(job.data.reminderId);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err.message);
  });

  logger.info('✅ Reminder worker started');

  return worker;
}

export async function processDueReminders(): Promise<void> {
  const pendingReminders = await getPendingReminders();
  
  logger.info(`Found ${pendingReminders.length} pending reminders to process`);

  for (const reminder of pendingReminders) {
    logger.info(`Processing reminder ${reminder.id} for subscription ${reminder.subscription.name}`);
  }
}