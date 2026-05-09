import { LeadQualification } from '../ai/ai.types';

export type LeadStatus =
  | 'new'
  | 'contacting'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'disqualified';

export interface LeadRecord {
  id: string;
  name?: string;
  company?: string;
  role?: string;
  phone: string;
  email?: string;
  notes?: string;
  status: LeadStatus;
  score?: number;
  qualification?: LeadQualification;
  lastCallId?: string;
  createdAt: string;
  updatedAt: string;
}
