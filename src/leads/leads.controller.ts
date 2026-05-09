import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Lead } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto): Promise<Lead> {
    return this.leads.create(dto);
  }

  @Get()
  list(): Promise<Lead[]> {
    return this.leads.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Lead> {
    return this.leads.get(id);
  }
}
