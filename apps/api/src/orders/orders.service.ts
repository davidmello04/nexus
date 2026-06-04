import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    await this.ensureCustomerExists(createOrderDto.customerId);
    this.ensureItems(createOrderDto.items);

    const totals = await this.calculateTotals(
      createOrderDto.customerId,
      createOrderDto.items,
      createOrderDto.discount,
    );

    return this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        status: createOrderDto.status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        notes: createOrderDto.notes,
        items: {
          create: totals.items,
        },
      },
      include: this.orderInclude,
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: this.orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado.');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const currentOrder = await this.findOne(id);

    if (updateOrderDto.items) {
      this.ensureItems(updateOrderDto.items);

      return this.prisma.$transaction(async (tx) => {
        const totals = await this.calculateTotals(
          currentOrder.customerId,
          updateOrderDto.items ?? [],
          updateOrderDto.discount ?? this.toNumber(currentOrder.discount),
        );

        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        await tx.order.update({
          where: { id },
          data: {
            status: updateOrderDto.status,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
            notes: updateOrderDto.notes,
            items: {
              create: totals.items,
            },
          },
        });

        return tx.order.findUniqueOrThrow({
          where: { id },
          include: this.orderInclude,
        });
      });
    }

    const subtotal = this.toNumber(currentOrder.subtotal);
    const discount =
      updateOrderDto.discount !== undefined
        ? updateOrderDto.discount
        : this.toNumber(currentOrder.discount);

    this.ensureDiscountIsValid(subtotal, discount);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
        discount,
        total: subtotal - discount,
        notes: updateOrderDto.notes,
      },
      include: this.orderInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.order.delete({
      where: { id },
    });
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }
  }

  private ensureItems(items?: OrderItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException('Pedido deve ter pelo menos um item.');
    }
  }

  private async calculateTotals(
    customerId: string,
    items: OrderItemDto[],
    discount = 0,
  ) {
    const calculatedItems = await Promise.all(
      items.map(async (item) => {
        const resolvedPrice = await this.pricingService.resolvePrice(
          customerId,
          item.productId,
          item.productVariantId,
        );
        const unitPrice = this.toNumber(resolvedPrice.price);
        const total = unitPrice * item.quantity;

        return {
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice,
          total,
          notes: item.notes,
        };
      }),
    );
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);

    this.ensureDiscountIsValid(subtotal, discount);

    return {
      items: calculatedItems,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  }

  private ensureDiscountIsValid(subtotal: number, discount: number) {
    if (discount > subtotal) {
      throw new BadRequestException('Desconto nao pode ser maior que subtotal.');
    }
  }

  private toNumber(value: Prisma.Decimal | number) {
    return Number(value);
  }

  private readonly orderInclude = {
    customer: true,
    items: {
      include: {
        product: true,
        productVariant: true,
      },
    },
  } satisfies Prisma.OrderInclude;
}
