import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Call } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCallInput {
  toNumber: string;
  fromNumber?: string;
  agentId: string;
  leadId?: string;
  status?: string;
  retellCallId?: string;
  metadata?: Record<string, unknown>;
}

export interface CallPatch {
  toNumber?: string;
  fromNumber?: string;
  agentId?: string;
  leadId?: string;
  retellCallId?: string;
  status?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
}

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateCallInput): Promise<Call> {
    return this.prisma.call.create({
      data: {
        toNumber: input.toNumber,
        fromNumber: input.fromNumber,
        agentId: input.agentId,
        leadId: input.leadId,
        status: input.status ?? 'queued',
        retellCallId: input.retellCallId,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  list(): Promise<Call[]> {
    return this.prisma.call.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string): Promise<Call> {
    const record = await this.prisma.call.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Call ${id} not found`);
    return record;
  }

  findByRetellId(retellCallId: string): Promise<Call | null> {
    return this.prisma.call.findUnique({ where: { retellCallId } });
  }

  update(id: string, patch: CallPatch): Promise<Call> {
    return this.prisma.call.update({ where: { id }, data: patch });
  }

  async upsertByRetellId(retellCallId: string, patch: CallPatch): Promise<Call> {
    const existing = await this.findByRetellId(retellCallId);
    if (existing) {
      return this.prisma.call.update({ where: { id: existing.id }, data: patch });
    }
    return this.prisma.call.create({
      data: {
        retellCallId,
        toNumber: patch.toNumber ?? 'unknown',
        agentId: patch.agentId ?? 'unknown',
        status: patch.status ?? 'in_progress',
        fromNumber: patch.fromNumber,
        leadId: patch.leadId,
        startedAt: patch.startedAt,
        endedAt: patch.endedAt,
        durationMs: patch.durationMs,
        transcript: patch.transcript,
        recordingUrl: patch.recordingUrl,
        summary: patch.summary,
      },
    });
  }
}
