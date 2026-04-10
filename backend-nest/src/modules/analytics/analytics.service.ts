import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCategoryWiseSpending(userId: string) {
    return this.prisma.subscription.groupBy({
      by: ["category"],
      where: {
        userId,
        status: "active",
        category: { not: null },
      },
      _sum: {
        amount: true,
      },
    });
  }

  async getMonthlySpendingTrend(userId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "nextBillingDate")::date as month,
        SUM(amount) as total_spending
      FROM "Subscription"
      WHERE "userId" = ${userId}
        AND "status" = 'active'
        AND "nextBillingDate" >= ${startDate}
        AND "nextBillingDate" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "nextBillingDate")
      ORDER BY month;
    `;
  }
}
