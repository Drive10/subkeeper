import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { DetectionService } from "./detection.service";

@ApiTags("detection")
@Controller("detect")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class DetectionController {
  constructor(private detectionService: DetectionService) {}

  @Post("sms")
  @ApiOperation({ summary: "Detect subscription from SMS" })
  async detectSms(@Request() req, @Body() body: { text: string }) {
    return this.detectionService.detectSms(req.user.id, body.text);
  }

  @Post("confirm")
  @ApiOperation({ summary: "Confirm or reject detection" })
  async confirm(
    @Request() req,
    @Body()
    body: {
      detectionLogId: string;
      confirmed: boolean;
      name?: string;
      amount?: number;
      billingCycle?: string;
    },
  ) {
    return this.detectionService.confirmDetection(req.user.id, body);
  }

  @Get("logs")
  @ApiOperation({ summary: "Get detection logs" })
  async getLogs(@Request() req, @Query("status") status?: string) {
    return this.detectionService.getLogs(req.user.id, status);
  }
}
