import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

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

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlySpend(
    userId: string,
    months: number = 6,
  ): Promise<MonthlySpend[]> {
    const results: MonthlySpend[] = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const start = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      const end = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
      );

      const payments = await this.prisma.payment.aggregate({
        where: {
          subscription: { userId },
          paymentDate: { gte: start, lte: end },
          status: "completed",
        },
        _sum: { amount: true },
      });

      results.push({
        month: `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
        total: payments._sum.amount || 0,
        currency: "INR",
      });
    }

    return results;
  }

  async getCategoryBreakdown(userId: string): Promise<CategorySpend[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, status: "active" },
      select: { category: true, amount: true },
    });

    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const sub of subscriptions) {
      const category = sub.category || "Uncategorized";
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + sub.amount,
        count: existing.count + 1,
      });
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async getSubscriptionStats(userId: string): Promise<SubscriptionStats> {
    const [active, paused, cancelled, expired] = await Promise.all([
      this.prisma.subscription.count({ where: { userId, status: "active" } }),
      this.prisma.subscription.count({ where: { userId, status: "paused" } }),
      this.prisma.subscription.count({
        where: { userId, status: "cancelled" },
      }),
      this.prisma.subscription.count({ where: { userId, status: "expired" } }),
    ]);

    return {
      totalActive: active,
      totalPaused: paused,
      totalCancelled: cancelled,
      totalExpired: expired,
    };
  }

  async getTotalMonthlySpend(
    userId: string,
  ): Promise<{ total: number; currency: string }> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, status: "active" },
      select: { amount: true, billingCycle: true, intervalCount: true },
    });

    let totalMonthly = 0;
    for (const sub of subscriptions) {
      totalMonthly += this.convertToMonthly(
        sub.amount,
        sub.billingCycle,
        sub.intervalCount,
      );
    }

    return { total: totalMonthly, currency: "INR" };
  }

  async getUpcomingRenewals(userId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
        nextBillingDate: { gte: new Date(), lte: futureDate },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        nextBillingDate: true,
      },
      orderBy: { nextBillingDate: "asc" },
    });

    const now = new Date();
    return subscriptions.map((sub) => ({
      ...sub,
      daysUntil: Math.ceil(
        (sub.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }

  async getUnusedSubscriptions(userId: string, daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
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
  }

  private convertToMonthly(
    amount: number,
    billingCycle: string,
    intervalCount: number,
  ): number {
    switch (billingCycle) {
      case "daily":
        return amount * 30 * intervalCount;
      case "weekly":
        return ((amount * 52) / 12) * intervalCount;
      case "monthly":
        return amount * intervalCount;
      case "quarterly":
        return (amount / 3) * intervalCount;
      case "yearly":
        return (amount / 12) * intervalCount;
      default:
        return amount;
    }
  }
}
