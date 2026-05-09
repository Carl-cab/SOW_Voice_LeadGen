export type CallStatus =
  | 'queued'
  | 'registered'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer';

export interface CallRecord {
  id: string;
  retellCallId?: string;
  toNumber: string;
  fromNumber?: string;
  agentId: string;
  leadId?: string;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
