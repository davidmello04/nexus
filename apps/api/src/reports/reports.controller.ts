import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders/export/excel')
  async exportOrdersReportExcel(
    @Res() response: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    const buffer = await this.reportsService.exportOrdersReportExcel({
      startDate,
      endDate,
      status,
      customerId,
    });

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="relatorio-pedidos.xlsx"',
    );

    return response.send(buffer);
  }

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
