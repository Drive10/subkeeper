import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

  async findBySubscription(subscriptionId: string) {
    return this.prisma.reminder.findMany({
      where: { subscriptionId },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async create(
    userId: string,
    data: { subscriptionId: string; type: string; scheduledAt: Date },
  ) {
    return this.prisma.reminder.create({
      data: {
        userId,
        subscriptionId: data.subscriptionId,
        type: data.type,
        scheduledAt: data.scheduledAt,
      },
    });
  }

  async cancel(id: string, userId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!reminder) throw new Error("Reminder not found");
    return this.prisma.reminder.delete({
      where: { id },
    });
  }
}