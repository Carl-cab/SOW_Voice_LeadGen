import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { RetellService } from '../retell/retell.service';
import { CallRecord } from './call.entity';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly retell: RetellService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCallDto): Promise<CallRecord> {
    const agentId =
      dto.agentId ?? this.config.get<string>('RETELL_DEFAULT_AGENT_ID');
    if (!agentId) {
      throw new HttpException(
        'agentId is required (or set RETELL_DEFAULT_AGENT_ID)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const fromNumber = this.config.get<string>('RETELL_FROM_NUMBER');

    const record = this.calls.create({
      toNumber: dto.toNumber,
      fromNumber,
      agentId,
      leadId: dto.leadId,
      metadata: dto.metadata,
    });

    try {
      const retell = await this.retell.createCall({
        toNumber: dto.toNumber,
        fromNumber,
        agentId,
        metadata: { ...dto.metadata, internalCallId: record.id },
      });
      return this.calls.update(record.id, {
        retellCallId: retell.call_id,
        status: 'registered',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.calls.update(record.id, { status: 'failed' });
      throw new HttpException(
        `Retell createCall failed: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get()
  list(): CallRecord[] {
    return this.calls.list();
  }

  @Get(':id')
  get(@Param('id') id: string): CallRecord {
    return this.calls.get(id);
  }
}
