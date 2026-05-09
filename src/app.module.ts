import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CallsModule } from './calls/calls.module';
import { RetellModule } from './retell/retell.module';
import { AiModule } from './ai/ai.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LeadsModule } from './leads/leads.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CallsModule,
    RetellModule,
    AiModule,
    WebhooksModule,
    LeadsModule,
    DashboardModule,
  ],
})
export class AppModule {}
