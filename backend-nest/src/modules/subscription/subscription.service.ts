import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    if (new Date(dto.nextBillingDate) < new Date()) {
      throw new Error("Next billing date must be in the future");
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        currency: dto.currency || "INR",
        billingCycle: dto.billingCycle || "monthly",
        intervalCount: dto.intervalCount || 1,
        nextBillingDate: new Date(dto.nextBillingDate),
        category: dto.category,
        description: dto.description,
      },
    });
  }

  async findAll(
    userId: string,
    filters?: { status?: string; category?: string },
  ) {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;

    return this.prisma.subscription.findMany({
      where,
      orderBy: { nextBillingDate: "asc" },
    });
  }

  async findById(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    return subscription;
  }

  async update(subscriptionId: string, userId: string, dto: any) {
    await this.findById(subscriptionId, userId);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: dto,
    });
  }

  async delete(subscriptionId: string, userId: string) {
    await this.findById(subscriptionId, userId);
    await this.prisma.subscription.delete({ where: { id: subscriptionId } });
  }

  async pause(subscriptionId: string, userId: string) {
    await this.findById(subscriptionId, userId);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "paused" },
    });
  }

  async resume(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    if (subscription.status !== "paused") {
      throw new Error("Can only resume paused subscriptions");
    }

    const nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      subscription.billingCycle,
    );

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "active", nextBillingDate },
    });
  }

  async getUpcoming(userId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
        nextBillingDate: { lte: futureDate, gte: new Date() },
      },
      orderBy: { nextBillingDate: "asc" },
    });
  }

  private calculateNextBillingDate(date: Date, billingCycle: string) {
    const next = new Date(date);
    switch (billingCycle) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
