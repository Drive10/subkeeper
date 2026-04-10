import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get("monthly-spend")
  @ApiOperation({ summary: "Get monthly spend" })
  async getMonthlySpend(@Request() req, @Query("months") months?: string) {
    return this.analyticsService.getMonthlySpend(
      req.user.id,
      months ? parseInt(months) : 6,
    );
  }

  @Get("category-breakdown")
  @ApiOperation({ summary: "Get category breakdown" })
  async getCategoryBreakdown(@Request() req) {
    return this.analyticsService.getCategoryBreakdown(req.user.id);
  }

  @Get("subscription-stats")
  @ApiOperation({ summary: "Get subscription stats" })
  async getSubscriptionStats(@Request() req) {
    return this.analyticsService.getSubscriptionStats(req.user.id);
  }

  @Get("total-monthly-spend")
  @ApiOperation({ summary: "Get total monthly spend" })
  async getTotalMonthlySpend(@Request() req) {
    return this.analyticsService.getTotalMonthlySpend(req.user.id);
  }

  @Get("upcoming-renewals")
  @ApiOperation({ summary: "Get upcoming renewals" })
  async getUpcomingRenewals(@Request() req, @Query("days") days?: string) {
    return this.analyticsService.getUpcomingRenewals(
      req.user.id,
      days ? parseInt(days) : 30,
    );
  }

  @Get("unused-subscriptions")
  @ApiOperation({ summary: "Get unused subscriptions" })
  async getUnusedSubscriptions(@Request() req, @Query("days") days?: string) {
    return this.analyticsService.getUnusedSubscriptions(
      req.user.id,
      days ? parseInt(days) : 30,
    );
  }
}
