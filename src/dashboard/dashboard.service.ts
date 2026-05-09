import { Injectable } from '@nestjs/common';
import { Call, Lead } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totals: {
    calls: number;
    leads: number;
    callsLast24h: number;
    leadsLast24h: number;
  };
  callsByStatus: Record<string, number>;
  leadsByStatus: Record<string, number>;
  averageLeadScore: number | null;
  hotLeads: Lead[];
  recentCalls: Call[];
  recentLeads: Lead[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalCalls,
      totalLeads,
      callsLast24h,
      leadsLast24h,
      callsByStatus,
      leadsByStatus,
      avgScore,
      hotLeads,
      recentCalls,
      recentLeads,
    ] = await Promise.all([
      this.prisma.call.count(),
      this.prisma.lead.count(),
      this.prisma.call.count({ where: { createdAt: { gte: since } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: since } } }),
      this.prisma.call.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.lead.aggregate({
        _avg: { score: true },
        where: { score: { not: null } },
      }),
      this.prisma.lead.findMany({
        where: { status: 'hot' },
        orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
        take: 10,
      }),
      this.prisma.call.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totals: {
        calls: totalCalls,
        leads: totalLeads,
        callsLast24h,
        leadsLast24h,
      },
      callsByStatus: this.toStatusMap(callsByStatus),
      leadsByStatus: this.toStatusMap(leadsByStatus),
      averageLeadScore:
        avgScore._avg.score !== null ? Number(avgScore._avg.score.toFixed(1)) : null,
      hotLeads,
      recentCalls,
      recentLeads,
    };
  }

  private toStatusMap(
    rows: Array<{ status: string; _count: { _all: number } }>,
  ): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});
  }
}
