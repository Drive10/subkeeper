import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const BillingCycle = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export const SubscriptionStatus = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  PAUSED: "paused",
  EXPIRED: "expired",
} as const;

export type BillingCycleType = typeof BillingCycle[keyof typeof BillingCycle];
export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: Object.values(BillingCycle) })
  @IsString()
  billingCycle: string;

  @ApiProperty()
  @IsDateString()
  nextBillingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingCycle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class SubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  billingCycle: string;

  @ApiProperty()
  nextBillingDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}