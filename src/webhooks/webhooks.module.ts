import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { RetellSignatureGuard } from './retell-signature.guard';
import { CallsModule } from '../calls/calls.module';
import { AiModule } from '../ai/ai.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [CallsModule, AiModule, LeadsModule],
  controllers: [WebhooksController],
  providers: [RetellSignatureGuard],
})
export class WebhooksModule {}
