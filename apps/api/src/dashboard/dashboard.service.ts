import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const openStatuses = [OrderStatus.DRAFT, OrderStatus.PENDING];

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
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          status: {
            in: openStatuses,
          },
        },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.IN_PRODUCTION },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.DONE },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.CANCELED },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DONE },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: {
            in: openStatuses,
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.IN_PRODUCTION },
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
}
