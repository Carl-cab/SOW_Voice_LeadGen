import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateCallDto {
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'toNumber must be E.164 format, e.g. +14155551234',
  })
  toNumber!: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
