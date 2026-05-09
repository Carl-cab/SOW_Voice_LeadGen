import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LeadRecord, LeadStatus } from './lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadQualification } from '../ai/ai.types';

@Injectable()
export class LeadsService {
  private readonly leads = new Map<string, LeadRecord>();

  create(dto: CreateLeadDto): LeadRecord {
    const now = new Date().toISOString();
    const record: LeadRecord = {
      id: randomUUID(),
      name: dto.name,
      company: dto.company,
      role: dto.role,
      phone: dto.phone,
      email: dto.email,
      notes: dto.notes,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };
    this.leads.set(record.id, record);
    return record;
  }

  list(): LeadRecord[] {
    return Array.from(this.leads.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  get(id: string): LeadRecord {
    const lead = this.leads.get(id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  update(id: string, patch: Partial<LeadRecord>): LeadRecord {
    const existing = this.get(id);
    const next: LeadRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.leads.set(id, next);
    return next;
  }

  applyQualification(
    id: string,
    qualification: LeadQualification,
    callId?: string,
  ): LeadRecord {
    const status: LeadStatus =
      qualification.status === 'disqualified'
        ? 'disqualified'
        : qualification.status;
    return this.update(id, {
      qualification,
      score: qualification.score,
      status,
      lastCallId: callId,
    });
  }
}
