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
import { Call } from '@prisma/client';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { RetellService } from '../retell/retell.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly retell: RetellService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCallDto): Promise<Call> {
    const agentId =
      dto.agentId ?? this.config.get<string>('RETELL_DEFAULT_AGENT_ID');
    if (!agentId) {
      throw new HttpException(
        'agentId is required (or set RETELL_DEFAULT_AGENT_ID)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const fromNumber = this.config.get<string>('RETELL_FROM_NUMBER');

    const record = await this.calls.create({
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
      return await this.calls.update(record.id, {
        retellCallId: retell.call_id,
        status: 'registered',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      await this.calls.update(record.id, { status: 'failed' });
      throw new HttpException(
        `Retell createCall failed: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get()
  list(): Promise<Call[]> {
    return this.calls.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Call> {
    return this.calls.get(id);
  }
}
