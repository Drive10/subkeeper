import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum BillingCycle {
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
  quarterly = "quarterly",
  yearly = "yearly",
  custom = "custom",
}

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

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  intervalCount?: number;

  @ApiProperty()
  @IsDateString()
  nextBillingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
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
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
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
  billingCycle: BillingCycle;

  @ApiProperty()
  intervalCount: number;

  @ApiProperty()
  nextBillingDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  category: string;
}
