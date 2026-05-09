export interface CallSummary {
  summary: string;
  outcome: 'qualified' | 'unqualified' | 'callback_requested' | 'no_answer' | 'voicemail';
  nextAction: string;
  topics: string[];
}

export interface LeadQualification {
  score: number;
  status: 'hot' | 'warm' | 'cold' | 'disqualified';
  reasoning: string;
  budgetSignal: 'high' | 'medium' | 'low' | 'unknown';
  timelineSignal: 'immediate' | 'short' | 'long' | 'unknown';
  authoritySignal: 'decision_maker' | 'influencer' | 'researcher' | 'unknown';
  needSignal: 'urgent' | 'identified' | 'exploring' | 'unknown';
}

export interface QualifyLeadInput {
  transcript: string;
  leadContext?: {
    name?: string;
    company?: string;
    role?: string;
    notes?: string;
  };
}
