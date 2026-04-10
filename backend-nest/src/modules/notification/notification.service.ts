import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async detectUpcomingRenewals(userId: string, daysAhead: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
        nextBillingDate: { lte: futureDate, gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        nextBillingDate: true,
        category: true,
      },
      orderBy: { nextBillingDate: "asc" },
    });
  }

  async detectExpensiveSubscriptions(
    userId: string,
    thresholdAmount: number = 1000,
  ) {
    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
        amount: { gte: thresholdAmount },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        category: true,
        nextBillingDate: true,
      },
      orderBy: { amount: "desc" },
    });
  }

  async detectHighFrequencySubscriptions(userId: string) {
    const monthlySubscriptions = await this.prisma.subscription.count({
      where: {
        userId,
        status: "active",
        billingCycle: "monthly",
      },
    });

    const yearlySubscriptions = await this.prisma.subscription.count({
      where: {
        userId,
        status: "active",
        billingCycle: "yearly",
      },
    });

    return {
      monthlyCount: monthlySubscriptions,
      yearlyCount: yearlySubscriptions,
      ratio: yearlySubscriptions > 0 ? monthlySubscriptions / yearlySubscriptions : 0,
    };
  }
}