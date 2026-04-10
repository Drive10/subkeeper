import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { SubscriptionService } from "./subscription.service";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "./subscription.dto";

@ApiTags("subscriptions")
@Controller("subscriptions")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: "Create subscription" })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all subscriptions" })
  async findAll(
    @Request() req,
    @Query("status") status?: string,
    @Query("category") category?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    const pagination = limit && page ? { limit: parseInt(limit), page: parseInt(page) } : undefined;
    const data = await this.subscriptionService.findAll(
      req.user.id,
      { status, category },
      pagination,
      sortBy,
      sortOrder,
    );
    return { data, count: Array.isArray(data) ? data.length : 0 };
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Get upcoming renewals" })
  async getUpcoming(@Request() req, @Query("days") days?: string) {
    return this.subscriptionService.getUpcoming(
      req.user.id,
      days ? parseInt(days) : 7,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subscription by ID" })
  async findById(@Request() req, @Param("id") id: string) {
    return this.subscriptionService.findById(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update subscription" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete subscription" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Request() req, @Param("id") id: string) {
    return this.subscriptionService.delete(id, req.user.id);
  }

  @Get("analytics/category")
  @ApiOperation({ summary: "Get category-wise spending" })
  async getCategoryWiseSpending(@Request() req) {
    return this.subscriptionService.getCategoryWiseSpending(req.user.id);
  }

  @Get("analytics/monthly-trend")
  @ApiOperation({ summary: "Get monthly spending trend" })
  async getMonthlySpendingTrend(@Request() req, @Query("months") months?: string) {
    return this.subscriptionService.getMonthlySpendingTrend(
      req.user.id,
      months ? parseInt(months) : 6,
    );
  }
}
