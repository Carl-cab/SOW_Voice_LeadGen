import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { CallSummary, LeadQualification, QualifyLeadInput } from './ai.types';

const SUMMARY_SYSTEM_PROMPT = `You are an analyst summarizing outbound sales discovery calls for a lead generation platform.
Produce a faithful, neutral summary grounded only in the transcript. Identify the call outcome, the
recommended next action for the sales rep, and the key topics discussed. Never invent facts that are
not present in the transcript.`;

const QUALIFY_SYSTEM_PROMPT = `You are a B2B lead qualification analyst using the BANT framework
(Budget, Authority, Need, Timeline). Score the lead from 0-100 based on signals in the transcript:

- 80-100 (hot): Clear budget, decision-maker, urgent need, near-term timeline.
- 60-79 (warm): Two of four BANT signals present and positive.
- 30-59 (cold): One signal present or weak signals across the board.
- 0-29 (disqualified): No signals, explicit rejection, or wrong-fit prospect.

Be conservative. Default each BANT signal to "unknown" unless the transcript provides direct evidence.
Provide concise reasoning that cites specific phrases from the transcript.`;

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: '2-4 sentence neutral summary of the call.' },
    outcome: {
      type: 'string',
      enum: ['qualified', 'unqualified', 'callback_requested', 'no_answer', 'voicemail'],
    },
    nextAction: { type: 'string', description: 'Recommended next action for the rep.' },
    topics: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key topics discussed (3-7 short phrases).',
    },
  },
  required: ['summary', 'outcome', 'nextAction', 'topics'],
  additionalProperties: false,
} as const;

const QUALIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', description: 'Lead score 0-100.' },
    status: { type: 'string', enum: ['hot', 'warm', 'cold', 'disqualified'] },
    reasoning: { type: 'string', description: 'Concise rationale citing transcript evidence.' },
    budgetSignal: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
    timelineSignal: { type: 'string', enum: ['immediate', 'short', 'long', 'unknown'] },
    authoritySignal: {
      type: 'string',
      enum: ['decision_maker', 'influencer', 'researcher', 'unknown'],
    },
    needSignal: { type: 'string', enum: ['urgent', 'identified', 'exploring', 'unknown'] },
  },
  required: [
    'score',
    'status',
    'reasoning',
    'budgetSignal',
    'timelineSignal',
    'authoritySignal',
    'needSignal',
  ],
  additionalProperties: false,
} as const;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set; AI calls will fail at runtime');
    }
    this.client = new Anthropic({ apiKey });
    this.model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
  }

  async summarizeTranscript(transcript: string): Promise<CallSummary> {
    if (!transcript.trim()) {
      return {
        summary: 'No transcript captured.',
        outcome: 'no_answer',
        nextAction: 'Retry the call later.',
        topics: [],
      };
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: SUMMARY_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        output_config: {
          format: { type: 'json_schema', schema: SUMMARY_SCHEMA },
        },
        messages: [
          {
            role: 'user',
            content: `Transcript:\n\n${transcript}`,
          },
        ],
      });

      return this.extractJson<CallSummary>(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`summarizeTranscript failed: ${message}`);
      throw new ServiceUnavailableException(`AI summary failed: ${message}`);
    }
  }

  async qualifyLead(input: QualifyLeadInput): Promise<LeadQualification> {
    const contextBlock = input.leadContext
      ? `Lead context:\n${JSON.stringify(input.leadContext, null, 2)}\n\n`
      : '';

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: QUALIFY_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        output_config: {
          format: { type: 'json_schema', schema: QUALIFICATION_SCHEMA },
        },
        messages: [
          {
            role: 'user',
            content: `${contextBlock}Transcript:\n\n${input.transcript}`,
          },
        ],
      });

      return this.extractJson<LeadQualification>(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`qualifyLead failed: ${message}`);
      throw new ServiceUnavailableException(`AI qualification failed: ${message}`);
    }
  }

  private extractJson<T>(response: Anthropic.Message): T {
    for (const block of response.content) {
      if (block.type === 'text') {
        return JSON.parse(block.text) as T;
      }
    }
    throw new Error('Anthropic response contained no text block');
  }
}
