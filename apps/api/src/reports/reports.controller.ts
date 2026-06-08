import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders')
  getOrdersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.reportsService.getOrdersReport({
      startDate,
      endDate,
      status,
      customerId,
    });
  }
}
