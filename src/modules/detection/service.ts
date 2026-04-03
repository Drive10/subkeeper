import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../shared/utils/database';
import { logger } from '../../shared/utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/errors';
import { createSubscription } from '../subscription/service';
import type { DetectSmsInput, DetectEmailInput, ConfirmDetectionInput } from './validations';
import type { BillingCycle, DetectionStatus } from '../../shared/types';

interface ParsedSubscription {
  name: string | null;
  amount: number | null;
  currency: string | null;
  billingCycle: BillingCycle | null;
  confidence: number;
  [key: string]: string | number | null | undefined;
}

const INDIAN_CURRENCY_SYMBOLS = ['₹', 'INR', 'Rs', 'rupees', 'Rupees'];
const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR',
  'Rs': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
};

const SUBSCRIPTION_KEYWORDS = [
  'subscription', 'charged', 'debited', 'payment', 'renewal', 
  'recurring', 'auto-pay', 'auto debit', 'subscription fee',
  'plan', 'membership', 'premium', 'Netflix', 'Spotify', 'Amazon',
  'Disney', 'Hotstar', 'Gym', 'Spotify', 'Apple', 'Google',
];

const BILLING_CYCLE_KEYWORDS: Record<string, BillingCycle> = {
  'monthly': 'monthly',
  'month': 'monthly',
  'yearly': 'yearly',
  'year': 'yearly',
  'annual': 'yearly',
  'weekly': 'weekly',
  'daily': 'daily',
  'quarterly': 'quarterly',
  'quarter': 'quarterly',
};

function extractAmount(text: string): { amount: number | null; currency: string | null } {
  const patterns = [
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:USD|EUR|GBP)\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/i,
    /(?:amount|charged|paid|debited|total)[\s:]*([\d,]+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 1000000) {
        let currency = 'INR';
        if (text.includes('$') || text.includes('USD')) currency = 'USD';
        else if (text.includes('€') || text.includes('EUR')) currency = 'EUR';
        else if (text.includes('£') || text.includes('GBP')) currency = 'GBP';
        return { amount, currency };
      }
    }
  }

  return { amount: null, currency: null };
}

function extractName(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const keyword of SUBSCRIPTION_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      const words = text.split(/\s+/);
      const keywordIndex = words.findIndex(w => w.toLowerCase().includes(keyword.toLowerCase()));
      
      if (keywordIndex !== -1) {
        const start = Math.max(0, keywordIndex - 2);
        const end = Math.min(words.length, keywordIndex + 3);
        const nameCandidate = words.slice(start, end).join(' ');
        
        if (nameCandidate.length >= 2 && nameCandidate.length <= 50) {
          return nameCandidate.trim();
        }
      }
    }
  }

  const firstSentence = text.split(/[.!]/)[0];
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence.trim();
  }

  return null;
}

function extractBillingCycle(text: string): BillingCycle | null {
  const lowerText = text.toLowerCase();
  
  for (const [keyword, cycle] of Object.entries(BILLING_CYCLE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return cycle;
    }
  }

  return null;
}

function parseSmsText(text: string): ParsedSubscription {
  const { amount, currency } = extractAmount(text);
  const name = extractName(text);
  const billingCycle = extractBillingCycle(text);

  let confidence = 0;
  if (amount) confidence += 40;
  if (name) confidence += 30;
  if (billingCycle) confidence += 20;
  
  const lowerText = text.toLowerCase();
  const hasSubscriptionKeyword = SUBSCRIPTION_KEYWORDS.some(k => lowerText.includes(k.toLowerCase()));
  if (hasSubscriptionKeyword) confidence += 10;

  confidence = Math.min(confidence, 100);

  return {
    name,
    amount,
    currency,
    billingCycle,
    confidence,
  };
}

export async function detectFromSms(userId: string, input: DetectSmsInput) {
  const parsed = parseSmsText(input.text);

  const detectionLog = await prisma.detectionLog.create({
    data: {
      id: uuidv4(),
      userId,
      rawText: input.text,
      parsedData: parsed,
      confidenceScore: parsed.confidence,
      status: parsed.confidence >= 50 ? 'matched' : 'unmatched',
    },
  });

  logger.info(`SMS detection log created: ${detectionLog.id} with confidence: ${parsed.confidence}`);

  return {
    detectionLog,
    parsed,
    suggestedAction: parsed.confidence >= 70 ? 'confirm' : 'review',
  };
}

export async function detectFromEmail(userId: string, input: DetectEmailInput) {
  const combinedText = `${input.subject || ''} ${input.body}`;
  const parsed = parseSmsText(combinedText);

  const detectionLog = await prisma.detectionLog.create({
    data: {
      id: uuidv4(),
      userId,
      rawText: combinedText,
      parsedData: parsed,
      confidenceScore: parsed.confidence,
      status: parsed.confidence >= 50 ? 'matched' : 'unmatched',
    },
  });

  logger.info(`Email detection log created: ${detectionLog.id} with confidence: ${parsed.confidence}`);

  return {
    detectionLog,
    parsed,
    suggestedAction: parsed.confidence >= 70 ? 'confirm' : 'review',
  };
}

export async function confirmDetection(userId: string, input: ConfirmDetectionInput) {
  const detectionLog = await prisma.detectionLog.findFirst({
    where: { id: input.detectionLogId, userId },
  });

  if (!detectionLog) {
    throw new NotFoundError('Detection log');
  }

  if (input.confirmed) {
    const parsed = detectionLog.parsedData as ParsedSubscription;
    
    if (!input.name || !input.amount) {
      throw new ValidationError('Name and amount are required to create subscription');
    }

    const billingCycle = input.billingCycle || parsed?.billingCycle || 'monthly';
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    await createSubscription(userId, {
      name: input.name,
      amount: input.amount,
      currency: parsed?.currency || 'INR',
      billingCycle,
      intervalCount: 1,
      nextBillingDate,
      category: undefined,
      description: `Detected from SMS/Email (confidence: ${detectionLog.confidenceScore}%)`,
    });

    await prisma.detectionLog.update({
      where: { id: input.detectionLogId },
      data: { status: 'confirmed' as DetectionStatus },
    });

    logger.info(`Detection confirmed, subscription created for user: ${userId}`);
  } else {
    await prisma.detectionLog.update({
      where: { id: input.detectionLogId },
      data: { status: 'rejected' as DetectionStatus },
    });

    logger.info(`Detection rejected for log: ${input.detectionLogId}`);
  }

  return { message: input.confirmed ? 'Subscription created' : 'Detection rejected' };
}

export async function getDetectionLogs(userId: string, status?: DetectionStatus) {
  const where: Record<string, unknown> = { userId };
  
  if (status) {
    where.status = status;
  }

  const logs = await prisma.detectionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return logs;
}

export async function getDetectionLogById(logId: string, userId: string) {
  const log = await prisma.detectionLog.findFirst({
    where: { id: logId, userId },
  });

  if (!log) {
    throw new NotFoundError('Detection log');
  }

  return log;
}