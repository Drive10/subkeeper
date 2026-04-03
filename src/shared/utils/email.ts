import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

const createTransporter = () => {
  if (config.isDevelopment) {
    return nodemailer.createTransport({
      host: 'mailhog',
      port: 1025,
      ignoreTLS: true,
    });
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.user
      ? {
          user: config.email.user,
          pass: config.email.password,
        }
      : undefined,
  });
};

let transporter: nodemailer.Transporter | null = null;

export async function initEmailService() {
  transporter = createTransporter();
  
  try {
    await transporter.verify();
    logger.info('✅ Email service initialized');
  } catch (error) {
    logger.warn('⚠️  Email service not available:', error);
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    await initEmailService();
  }

  if (!transporter) {
    logger.warn('📧 Email not sent - transporter not available');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`📧 Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('📧 Email send failed:', error);
    return false;
  }
}

export async function sendReminderEmail(
  email: string,
  subscriptionName: string,
  amount: number,
  currency: string,
  nextBillingDate: Date,
  daysUntil: number
) {
  const dateStr = nextBillingDate.toLocaleDateString();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🔔 Subscription Reminder</h2>
      <p>Your <strong>${subscriptionName}</strong> subscription will renew in <strong>${daysUntil} day${daysUntil === 1 ? '' : 's'}</strong>.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${currency} ${amount}</p>
        <p style="margin: 5px 0;"><strong>Renewal Date:</strong> ${dateStr}</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        Log in to your SubSense dashboard to manage your subscriptions.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🔔 Reminder: ${subscriptionName} renewal in ${daysUntil} days`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>👋 Welcome to SubSense!</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for joining SubSense - your personal subscription intelligence platform.</p>
      <p>With SubSense you can:</p>
      <ul>
        <li>Track all your subscriptions in one place</li>
        <li>Get reminders before renewal dates</li>
        <li>Detect subscriptions from SMS/Emails automatically</li>
        <li>Identify unused subscriptions and save money</li>
      </ul>
      <p>Get started by adding your first subscription!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SubSense! 🎉',
    html,
  });
}