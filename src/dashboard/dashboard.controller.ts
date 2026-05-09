import { Controller, Get } from '@nestjs/common';
import { DashboardService, DashboardStats } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getStats(): Promise<DashboardStats> {
    return this.dashboard.getStats();
  }
}
