import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { BillingModule } from "./modules/billing/billing.module";
import { DetectionModule } from "./modules/detection/detection.module";
import { ReminderModule } from "./modules/reminder/reminder.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SubscriptionModule,
    AnalyticsModule,
    BillingModule,
    DetectionModule,
    ReminderModule,
  ],
})
export class AppModule {}
