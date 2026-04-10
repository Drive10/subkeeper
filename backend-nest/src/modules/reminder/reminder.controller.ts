import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ReminderService } from "./reminder.service";

@ApiTags("reminders")
@Controller("reminders")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ReminderController {
  constructor(private reminderService: ReminderService) {}

  @Get(":subscriptionId")
  @ApiOperation({ summary: "Get reminders for subscription" })
  async findBySubscription(@Param("subscriptionId") subscriptionId: string) {
    return this.reminderService.findBySubscription(subscriptionId);
  }

  @Post()
  @ApiOperation({ summary: "Create reminder" })
  async create(
    @Request() req,
    @Body()
    body: { subscriptionId: string; reminderType: string; daysOffset: number },
  ) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + body.daysOffset);
    return this.reminderService.create(body.subscriptionId, {
      reminderType: body.reminderType,
      daysOffset: body.daysOffset,
      scheduledAt,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancel reminder" })
  async cancel(@Param("id") id: string, @Request() req) {
    return this.reminderService.cancel(id, req.user.id);
  }
}
