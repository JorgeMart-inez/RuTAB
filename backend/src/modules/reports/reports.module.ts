// src/modules/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}