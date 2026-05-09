import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phone must be E.164 format, e.g. +14155551234',
  })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
