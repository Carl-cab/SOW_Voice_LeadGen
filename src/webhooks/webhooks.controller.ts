import { Body, Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { AiService } from '../ai/ai.service';
import { LeadsService } from '../leads/leads.service';
import { RetellSignatureGuard } from './retell-signature.guard';

interface RetellWebhookPayload {
  event: string;
  call?: {
    call_id: string;
    call_status?: string;
    to_number?: string;
    from_number?: string;
    agent_id?: string;
    start_timestamp?: number;
    end_timestamp?: number;
    transcript?: string;
    recording_url?: string;
    metadata?: Record<string, unknown>;
  };
}

@Controller('webhooks/retell')
@UseGuards(RetellSignatureGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly calls: CallsService,
    private readonly ai: AiService,
    private readonly leads: LeadsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() payload: RetellWebhookPayload): Promise<{ ok: true }> {
    this.logger.log(`Retell webhook event=${payload.event} call_id=${payload.call?.call_id}`);

    if (!payload.call?.call_id) {
      return { ok: true };
    }

    const { call } = payload;

    switch (payload.event) {
      case 'call_started':
        await this.calls.upsertByRetellId(call.call_id, {
          status: 'in_progress',
          startedAt: call.start_timestamp ? new Date(call.start_timestamp) : new Date(),
        });
        break;

      case 'call_ended': {
        const startedAt = call.start_timestamp ? new Date(call.start_timestamp) : undefined;
        const endedAt = call.end_timestamp ? new Date(call.end_timestamp) : new Date();
        await this.calls.upsertByRetellId(call.call_id, {
          status: 'completed',
          endedAt,
          durationMs: startedAt ? endedAt.getTime() - startedAt.getTime() : undefined,
          transcript: call.transcript,
          recordingUrl: call.recording_url,
        });
        break;
      }

      case 'call_analyzed': {
        const record = await this.calls.findByRetellId(call.call_id);
        const transcript = call.transcript ?? record?.transcript ?? '';

        if (!transcript) {
          this.logger.warn(`call_analyzed without transcript for ${call.call_id}`);
          break;
        }

        const summary = await this.ai.summarizeTranscript(transcript);
        const updated = await this.calls.upsertByRetellId(call.call_id, {
          transcript,
          summary: summary.summary,
        });

        if (updated.leadId) {
          const qualification = await this.ai.qualifyLead({ transcript });
          await this.leads.applyQualification(updated.leadId, qualification, updated.id);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Retell event: ${payload.event}`);
    }

    return { ok: true };
  }
}
