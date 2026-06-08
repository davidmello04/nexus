import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
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
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
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

  private decimalToNumber(value: Prisma.Decimal | null) {
    return value?.toNumber() ?? 0;
  }
}
