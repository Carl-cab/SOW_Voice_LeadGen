import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import {
  CreateCallParams,
  RetellCreateCallResponse,
} from './retell.types';

const RETELL_BASE_URL = 'https://api.retellai.com';

@Injectable()
export class RetellService {
  private readonly logger = new Logger(RetellService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RETELL_API_KEY');
    if (!apiKey) {
      this.logger.warn('RETELL_API_KEY not set; Retell calls will fail at runtime');
    }
    this.http = axios.create({
      baseURL: RETELL_BASE_URL,
      timeout: 15_000,
      headers: {
        Authorization: `Bearer ${apiKey ?? ''}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createCall(params: CreateCallParams): Promise<RetellCreateCallResponse> {
    const body = {
      to_number: params.toNumber,
      from_number: params.fromNumber,
      override_agent_id: params.agentId,
      metadata: params.metadata,
    };

    try {
      const res = await this.http.post<RetellCreateCallResponse>(
        '/v2/create-phone-call',
        body,
      );
      this.logger.log(
        `Retell call created call_id=${res.data.call_id} to=${params.toNumber}`,
      );
      return res.data;
    } catch (err) {
      const detail = isAxiosError(err)
        ? `${err.response?.status} ${JSON.stringify(err.response?.data)}`
        : err instanceof Error
          ? err.message
          : 'unknown';
      this.logger.error(`Retell createCall failed: ${detail}`);
      throw new ServiceUnavailableException(`Retell error: ${detail}`);
    }
  }

  async getCall(callId: string): Promise<RetellCreateCallResponse> {
    try {
      const res = await this.http.get<RetellCreateCallResponse>(
        `/v2/get-call/${callId}`,
      );
      return res.data;
    } catch (err) {
      const detail = isAxiosError(err)
        ? `${err.response?.status} ${JSON.stringify(err.response?.data)}`
        : err instanceof Error
          ? err.message
          : 'unknown';
      throw new ServiceUnavailableException(`Retell error: ${detail}`);
    }
  }
}
