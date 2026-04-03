import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { prisma } from '../../shared/utils/database';
import type { SubscriptionStatus, PaymentStatus } from '../../shared/types';

interface MonthlySpend {
  month: string;
  total: number;
  currency: string;
}

interface CategorySpend {
  category: string;
  total: number;
  count: number;
}

interface SubscriptionStats {
  totalActive: number;
  totalPaused: number;
  totalCancelled: number;
  totalExpired: number;
}

interface UpcomingRenewal {
  id: string;
  name: string;
  amount: number;
  currency: string;
  nextBillingDate: Date;
  daysUntil: number;
}

export async function getMonthlySpend(userId: string, months: number = 6): Promise<MonthlySpend[]> {
  const results: MonthlySpend[] = [];

  for (let i = 0; i < months; i++) {
    const targetDate = subMonths(new Date(), i);
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    const payments = await prisma.payment.aggregate({
      where: {
        subscription: { userId },
        paymentDate: { gte: start, lte: end },
        status: 'completed' as PaymentStatus,
      },
      _sum: { amount: true },
    });

    const total = payments._sum.amount || 0;
    const monthLabel = format(targetDate, 'MMM yyyy');

    results.push({
      month: monthLabel,
      total,
      currency: 'INR',
    });
  }

  return results.reverse();
}

export async function getCategoryBreakdown(userId: string): Promise<CategorySpend[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'active' as SubscriptionStatus },
    select: { category: true, amount: true },
  });

  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const sub of subscriptions) {
    const category = sub.category || 'Uncategorized';
    const existing = categoryMap.get(category) || { total: 0, count: 0 };
    categoryMap.set(category, {
      total: existing.total + sub.amount,
      count: existing.count + 1,
    });
  }

  const results: CategorySpend[] = [];
  for (const [category, data] of categoryMap) {
    results.push({ category, total: data.total, count: data.count });
  }

  return results.sort((a, b) => b.total - a.total);
}

export async function getSubscriptionStats(userId: string): Promise<SubscriptionStats> {
  const [active, paused, cancelled, expired] = await Promise.all([
    prisma.subscription.count({ where: { userId, status: 'active' } }),
    prisma.subscription.count({ where: { userId, status: 'paused' } }),
    prisma.subscription.count({ where: { userId, status: 'cancelled' } }),
    prisma.subscription.count({ where: { userId, status: 'expired' } }),
  ]);

  return {
    totalActive: active,
    totalPaused: paused,
    totalCancelled: cancelled,
    totalExpired: expired,
  };
}

export async function getUpcomingRenewals(userId: string, days: number = 30): Promise<UpcomingRenewal[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: 'active' as SubscriptionStatus,
      nextBillingDate: {
        gte: new Date(),
        lte: futureDate,
      },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      currency: true,
      nextBillingDate: true,
    },
    orderBy: { nextBillingDate: 'asc' },
  });

  const now = new Date();
  return subscriptions.map((sub) => {
    const daysUntil = Math.ceil((sub.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...sub,
      daysUntil,
    };
  });
}

export async function getTotalMonthlySpend(userId: string): Promise<{ total: number; currency: string }> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'active' as SubscriptionStatus },
    select: { amount: true, billingCycle: true, intervalCount: true },
  });

  let totalMonthly = 0;

  for (const sub of subscriptions) {
    const monthlyAmount = convertToMonthly(sub.amount, sub.billingCycle, sub.intervalCount);
    totalMonthly += monthlyAmount;
  }

  return { total: totalMonthly, currency: 'INR' };
}

function convertToMonthly(amount: number, billingCycle: string, intervalCount: number): number {
  switch (billingCycle) {
    case 'daily':
      return amount * 30 * intervalCount;
    case 'weekly':
      return (amount * 52 / 12) * intervalCount;
    case 'monthly':
      return amount * intervalCount;
    case 'quarterly':
      return (amount / 3) * intervalCount;
    case 'yearly':
      return (amount / 12) * intervalCount;
    case 'custom':
      return (amount / 30) * intervalCount;
    default:
      return amount;
  }
}

export async function getUnusedSubscriptions(userId: string, daysThreshold: number = 30): Promise<Array<{
  id: string;
  name: string;
  amount: number;
  currency: string;
  lastBillingDate: Date | null;
  daysSinceLastPayment: number | null;
}>> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: 'active' as SubscriptionStatus,
      lastBillingDate: { lt: thresholdDate },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      currency: true,
      lastBillingDate: true,
    },
  });

  const now = new Date();
  return subscriptions.map((sub) => ({
    ...sub,
    daysSinceLastPayment: sub.lastBillingDate
      ? Math.ceil((now.getTime() - sub.lastBillingDate.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}