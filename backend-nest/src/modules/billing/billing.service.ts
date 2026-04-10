import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, subscriptionId?: string) {
    const where: Record<string, unknown> = { userId };
    if (subscriptionId) where.subscriptionId = subscriptionId;
    return this.prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
    });
  }

  async create(
    userId: string,
    data: {
      subscriptionId: string;
      amount: number;
      currency?: string;
      paymentDate: string;
    },
  ) {
    return this.prisma.payment.create({
      data: {
        id: uuidv4(),
        userId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency || "INR",
        paymentDate: new Date(data.paymentDate),
        status: "pending",
      },
    });
  }
}
