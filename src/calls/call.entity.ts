import type { Call } from '@prisma/client';

export type CallRecord = Call;

export type CallStatus =
  | 'queued'
  | 'registered'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer';
