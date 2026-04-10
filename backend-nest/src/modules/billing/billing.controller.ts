import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { BillingService } from "./billing.service";
import { CreatePaymentDto } from "./billing.dto";

@ApiTags("payments")
@Controller("payments")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: "Get all payments" })
  async findAll(
    @Request() req,
    @Query("subscriptionId") subscriptionId?: string,
  ) {
    return this.billingService.findAll(req.user.id, subscriptionId);
  }

  @Post()
  @ApiOperation({ summary: "Create payment" })
  async create(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.billingService.create(req.user.id, dto);
  }
}
