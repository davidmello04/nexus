import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

type OrdersReportFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
  customerId?: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrdersReport(filters: OrdersReportFilters = {}) {
    const where = this.buildOrdersWhere(filters);

    const [orders, totals] = await Promise.all([
      this.findOrders(where),
      this.prisma.order.aggregate({
        where,
        _count: {
          _all: true,
        },
        _sum: {
          subtotal: true,
          discount: true,
          total: true,
        },
      }),
    ]);

    return {
      orders: orders.map((order) => ({
        ...order,
        subtotal: this.decimalToNumber(order.subtotal),
        discount: this.decimalToNumber(order.discount),
        total: this.decimalToNumber(order.total),
      })),
      summary: {
        ordersCount: totals._count._all,
        subtotalTotal: this.decimalToNumber(totals._sum.subtotal),
        discountTotal: this.decimalToNumber(totals._sum.discount),
        grandTotal: this.decimalToNumber(totals._sum.total),
      },
    };
  }

  async exportOrdersReportExcel(filters: OrdersReportFilters = {}) {
    const where = this.buildOrdersWhere(filters);
    const orders = await this.findOrders(where);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedidos');

    workbook.creator = 'Nexus';
    workbook.created = new Date();

    worksheet.columns = [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Cliente', key: 'customer', width: 32 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Subtotal', key: 'subtotal', width: 16 },
      { header: 'Desconto', key: 'discount', width: 16 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Data', key: 'createdAt', width: 18 },
      { header: 'Observações', key: 'notes', width: 40 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle' };

    orders.forEach((order) => {
      worksheet.addRow({
        code: order.code,
        customer: order.customer?.name ?? '-',
        status: this.getStatusLabel(order.status),
        subtotal: this.decimalToNumber(order.subtotal),
        discount: this.decimalToNumber(order.discount),
        total: this.decimalToNumber(order.total),
        createdAt: order.createdAt,
        notes: order.notes ?? '',
      });
    });

    ['subtotal', 'discount', 'total'].forEach((columnKey) => {
      worksheet.getColumn(columnKey).numFmt = '"R$" #,##0.00';
    });
    worksheet.getColumn('createdAt').numFmt = 'dd/mm/yyyy';
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  private findOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private buildOrdersWhere(filters: OrdersReportFilters) {
    const where: Prisma.OrderWhereInput = {};
    const createdAtFilter = this.buildCreatedAtFilter(filters);

    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    if (filters.status) {
      where.status = this.parseStatus(filters.status);
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    return where;
  }

  private buildCreatedAtFilter({
    startDate,
    endDate,
  }: OrdersReportFilters): Prisma.DateTimeFilter | undefined {
    const filter: Prisma.DateTimeFilter = {};

    if (startDate) {
      const parsedStartDate = this.parseDate(startDate, 'Data inicial inválida.');
      parsedStartDate.setHours(0, 0, 0, 0);
      filter.gte = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = this.parseDate(endDate, 'Data final inválida.');
      parsedEndDate.setHours(23, 59, 59, 999);
      filter.lte = parsedEndDate;
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private parseDate(value: string, errorMessage: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(errorMessage);
    }

    const date = new Date(`${value}T00:00:00`);
    const [year, month, day] = value.split('-').map(Number);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException(errorMessage);
    }

    return date;
  }

  private parseStatus(status: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Status inválido.');
    }

    return status as OrderStatus;
  }

  private getStatusLabel(status: OrderStatus) {
    const labels: Record<OrderStatus, string> = {
      DRAFT: 'Rascunho',
      PENDING: 'Pendente',
      IN_PRODUCTION: 'Em produção',
      DONE: 'Concluído',
      CANCELED: 'Cancelado',
    };

    return labels[status];
  }

  private decimalToNumber(value: Prisma.Decimal | null) {
    return value?.toNumber() ?? 0;
  }
}
