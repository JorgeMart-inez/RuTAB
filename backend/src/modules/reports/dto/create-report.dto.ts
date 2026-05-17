// src/modules/reports/dto/create-report.dto.ts
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';

export enum ReportPeriod {
  LAST_WEEK = 'last-week',
  TWO_WEEKS = 'two-weeks',
  THIS_MONTH = 'this-month',
  CUSTOM = 'custom'
}

export class CreateReportDto {
  @IsString()
  title: string;

  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  // Solo necesarios si el periodo es 'custom'
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  chartImage?: string;
}