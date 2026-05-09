import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadRecord } from './lead.entity';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto): LeadRecord {
    return this.leads.create(dto);
  }

  @Get()
  list(): LeadRecord[] {
    return this.leads.list();
  }

  @Get(':id')
  get(@Param('id') id: string): LeadRecord {
    return this.leads.get(id);
  }
}
