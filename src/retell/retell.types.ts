export interface CreateCallParams {
  toNumber: string;
  fromNumber?: string;
  agentId: string;
  metadata?: Record<string, unknown>;
}

export interface RetellCreateCallResponse {
  call_id: string;
  agent_id: string;
  call_status: string;
  to_number: string;
  from_number?: string;
  [k: string]: unknown;
}
