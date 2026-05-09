import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CallRecord, CallStatus } from './call.entity';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  private readonly calls = new Map<string, CallRecord>();
  private readonly retellIndex = new Map<string, string>();

  create(partial: Omit<CallRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    status?: CallStatus;
  }): CallRecord {
    const now = new Date().toISOString();
    const record: CallRecord = {
      id: randomUUID(),
      status: partial.status ?? 'queued',
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    this.calls.set(record.id, record);
    if (record.retellCallId) {
      this.retellIndex.set(record.retellCallId, record.id);
    }
    return record;
  }

  list(): CallRecord[] {
    return Array.from(this.calls.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  get(id: string): CallRecord {
    const record = this.calls.get(id);
    if (!record) throw new NotFoundException(`Call ${id} not found`);
    return record;
  }

  findByRetellId(retellCallId: string): CallRecord | undefined {
    const id = this.retellIndex.get(retellCallId);
    return id ? this.calls.get(id) : undefined;
  }

  update(id: string, patch: Partial<CallRecord>): CallRecord {
    const existing = this.get(id);
    const next: CallRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.calls.set(id, next);
    if (patch.retellCallId && patch.retellCallId !== existing.retellCallId) {
      this.retellIndex.set(patch.retellCallId, id);
    }
    return next;
  }

  upsertByRetellId(retellCallId: string, patch: Partial<CallRecord>): CallRecord {
    const existing = this.findByRetellId(retellCallId);
    if (existing) {
      return this.update(existing.id, patch);
    }
    this.logger.warn(
      `No local call for retellCallId=${retellCallId}; creating shadow record`,
    );
    return this.create({
      retellCallId,
      toNumber: patch.toNumber ?? 'unknown',
      agentId: patch.agentId ?? 'unknown',
      ...patch,
    });
  }
}
