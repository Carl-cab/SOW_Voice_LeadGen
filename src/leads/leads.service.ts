import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Lead } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadStatus } from './lead.entity';
import { LeadQualification } from '../ai/ai.types';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLeadDto): Promise<Lead> {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        company: dto.company,
        role: dto.role,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
        status: 'new',
      },
    });
  }

  list(): Promise<Lead[]> {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  update(id: string, patch: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.prisma.lead.update({ where: { id }, data: patch });
  }

  applyQualification(
    id: string,
    qualification: LeadQualification,
    callId?: string,
  ): Promise<Lead> {
    const status: LeadStatus =
      qualification.status === 'disqualified'
        ? 'disqualified'
        : qualification.status;
    return this.prisma.lead.update({
      where: { id },
      data: {
        qualification: qualification as unknown as Prisma.InputJsonValue,
        score: qualification.score,
        status,
        lastCallId: callId,
      },
    });
  }
}
