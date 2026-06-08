import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DashboardSummaryFilters = {
  startDate?: string;
  endDate?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(filters: DashboardSummaryFilters = {}) {
    const openStatuses = [OrderStatus.DRAFT, OrderStatus.PENDING];
    const createdAtFilter = this.buildCreatedAtFilter(filters);
    const orderPeriodWhere: Prisma.OrderWhereInput = createdAtFilter
      ? { createdAt: createdAtFilter }
      : {};

    const [
      totalOrders,
      openOrders,
      productionOrders,
      doneOrders,
      canceledOrders,
      doneTotals,
      pendingTotals,
      productionTotals,
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalProducts,
      activeProducts,
      inactiveProducts,
    ] = await Promise.all([
      this.prisma.order.count({
        where: orderPeriodWhere,
      }),
      this.prisma.order.count({
        where: {
          ...orderPeriodWhere,
          status: {
            in: openStatuses,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          ...orderPeriodWhere,
          status: OrderStatus.IN_PRODUCTION,
        },
      }),
      this.prisma.order.count({
        where: {
          ...orderPeriodWhere,
          status: OrderStatus.DONE,
        },
      }),
      this.prisma.order.count({
        where: {
          ...orderPeriodWhere,
          status: OrderStatus.CANCELED,
        },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderPeriodWhere,
          status: OrderStatus.DONE,
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderPeriodWhere,
          status: {
            in: openStatuses,
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderPeriodWhere,
          status: OrderStatus.IN_PRODUCTION,
        },
        _sum: { total: true },
      }),
      this.prisma.customer.count(),
      this.prisma.customer.count({
        where: { active: true },
      }),
      this.prisma.customer.count({
        where: { active: false },
      }),
      this.prisma.product.count(),
      this.prisma.product.count({
        where: { active: true },
      }),
      this.prisma.product.count({
        where: { active: false },
      }),
    ]);

    return {
      totalOrders,
      openOrders,
      productionOrders,
      doneOrders,
      canceledOrders,
      totalSoldDone: this.decimalToNumber(doneTotals._sum.total),
      totalPending: this.decimalToNumber(pendingTotals._sum.total),
      totalInProduction: this.decimalToNumber(productionTotals._sum.total),
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalProducts,
      activeProducts,
      inactiveProducts,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null) {
    return value?.toNumber() ?? 0;
  }

  private buildCreatedAtFilter({
    startDate,
    endDate,
  }: DashboardSummaryFilters): Prisma.DateTimeFilter | undefined {
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
}
