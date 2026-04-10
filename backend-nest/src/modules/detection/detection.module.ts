import { Module } from "@nestjs/common";
import { DetectionController } from "./detection.controller";
import { DetectionService } from "./detection.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DetectionController],
  providers: [DetectionService],
  exports: [DetectionService],
})
export class DetectionModule {}
