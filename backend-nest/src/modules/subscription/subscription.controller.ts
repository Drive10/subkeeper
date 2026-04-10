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
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from "./subscription.dto";

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
  ) {
    return this.subscriptionService.findAll(req.user.id, { status, category });
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

  @Post(":id/pause")
  @ApiOperation({ summary: "Pause subscription" })
  async pause(@Request() req, @Param("id") id: string) {
    return this.subscriptionService.pause(id, req.user.id);
  }

  @Post(":id/resume")
  @ApiOperation({ summary: "Resume subscription" })
  async resume(@Request() req, @Param("id") id: string) {
    return this.subscriptionService.resume(id, req.user.id);
  }
}
