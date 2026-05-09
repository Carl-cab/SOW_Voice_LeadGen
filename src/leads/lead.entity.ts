import type { Lead } from '@prisma/client';

export type LeadRecord = Lead;

export type LeadStatus =
  | 'new'
  | 'contacting'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'disqualified';
