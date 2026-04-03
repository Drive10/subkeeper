import { logger } from '../../shared/utils/logger';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationPayload {
  userId: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    logger.info(`Sending ${payload.channel} notification to user ${payload.userId}`);

    try {
      switch (payload.channel) {
        case 'email':
          return await this.sendEmail(payload);
        case 'sms':
          return await this.sendSms(payload);
        case 'push':
          return await this.sendPush(payload);
        default:
          throw new Error(`Unsupported channel: ${payload.channel}`);
      }
    } catch (error) {
      logger.error(`Failed to send notification:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    logger.info(`[MOCK EMAIL] To: ${payload.userId}, Subject: ${payload.subject || 'Notification'}, Message: ${payload.message}`);
    
    return {
      success: true,
      messageId: `email_${Date.now()}`,
    };
  }

  private async sendSms(payload: NotificationPayload): Promise<NotificationResult> {
    logger.info(`[MOCK SMS] To: ${payload.userId}, Message: ${payload.message}`);
    
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  }

  private async sendPush(payload: NotificationPayload): Promise<NotificationResult> {
    logger.info(`[MOCK PUSH] To: ${payload.userId}, Message: ${payload.message}`);
    
    return {
      success: true,
      messageId: `push_${Date.now()}`,
    };
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    for (const payload of payloads) {
      const result = await this.send(payload);
      results.push(result);
    }
    
    return results;
  }
}

export const notificationService = NotificationService.getInstance();