import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CallsModule } from './calls/calls.module';
import { RetellModule } from './retell/retell.module';
import { AiModule } from './ai/ai.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LeadsModule } from './leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CallsModule,
    RetellModule,
    AiModule,
    WebhooksModule,
    LeadsModule,
  ],
})
export class AppModule {}
