import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DetectionService {
  constructor(private prisma: PrismaService) {}

  async detectFromSms(userId: string, text: string) {
    const patterns = [
      { regex: /(₹|Rs\.?|INR)\s*(\d+)/i, amount: 2 },
      { regex: /(Netflix|Spotify|Amazon|Disney|Hotstar|YouTube)/i, service: 1 },
      { regex: /(monthly|month|yr|year|annual)/i, cycle: 1 },
    ];

    let amount = 0;
    let service = "";
    let confidence = 0;
    let billingCycle = "monthly";

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match && pattern.amount) {
        amount = parseInt(match[pattern.amount]) || 0;
        confidence += 30;
      }
      if (match && pattern.service) {
        service = match[pattern.service];
        confidence += 40;
      }
      if (match && pattern.cycle) {
        billingCycle = match[1].toLowerCase().includes("yr") ? "yearly" : "monthly";
        confidence += 20;
      }
    }

    confidence = Math.min(confidence, 100);

    const parsed = {
      name: service || null,
      amount,
      billingCycle,
      confidence,
    };
    const status = confidence >= 50 ? "matched" : "unmatched";

    const log = await this.prisma.detectionLog.create({
      data: {
        id: uuidv4(),
        userId,
        type: "sms",
        data: parsed,
      },
    });

    return {
      detectionLog: log,
      parsed,
      suggestedAction: confidence >= 70 ? "confirm" : "review",
    };
  }

  async confirmDetection(
    userId: string,
    data: {
      detectionLogId: string;
      confirmed: boolean;
      name?: string;
      amount?: number;
      billingCycle?: string;
    },
  ) {
    const log = await this.prisma.detectionLog.findFirst({
      where: { id: data.detectionLogId, userId },
    });
    if (!log) throw new Error("Detection log not found");

    if (data.confirmed && data.name && data.amount) {
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      await this.prisma.subscription.create({
        data: {
          id: uuidv4(),
          userId,
          name: data.name,
          amount: data.amount,
          currency: "INR",
          billingCycle: (data.billingCycle || "monthly") as any,
          nextBillingDate,
          status: "active",
        },
      });
      await this.prisma.detectionLog.update({
        where: { id: data.detectionLogId },
        data: { processed: true },
      });
      return { message: "Subscription created" };
    }

    await this.prisma.detectionLog.update({
      where: { id: data.detectionLogId },
      data: { processed: true },
    });
    return { message: "Detection rejected" };
  }

  async rejectDetection(userId: string, detectionLogId: string) {
    const log = await this.prisma.detectionLog.findFirst({
      where: { id: detectionLogId, userId },
    });
    if (!log) throw new Error("Detection log not found");

    await this.prisma.detectionLog.update({
      where: { id: detectionLogId },
      data: { processed: true },
    });
    return { message: "Detection rejected" };
  }

  async getDetectionLogs(userId: string) {
    return this.prisma.detectionLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}