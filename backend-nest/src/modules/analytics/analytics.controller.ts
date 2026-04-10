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

  @Get("category-wise")
  @ApiOperation({ summary: "Get category-wise spending" })
  async getCategoryWiseSpending(@Request() req) {
    return this.analyticsService.getCategoryWiseSpending(req.user.id);
  }

  @Get("monthly-trend")
  @ApiOperation({ summary: "Get monthly spending trend" })
  async getMonthlySpendingTrend(@Request() req, @Query("months") months?: string) {
    return this.analyticsService.getMonthlySpendingTrend(
      req.user.id,
      months ? parseInt(months) : 6,
    );
  }
}
