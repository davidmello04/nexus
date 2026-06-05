import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerProductPriceDto } from './dto/create-customer-product-price.dto';
import { UpdateCustomerProductPriceDto } from './dto/update-customer-product-price.dto';

@Injectable()
export class CustomerProductPricesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerProductPriceDto: CreateCustomerProductPriceDto) {
    await this.validateRelations(createCustomerProductPriceDto);
    await this.ensurePriceDoesNotExist({
      customerId: createCustomerProductPriceDto.customerId,
      productId: createCustomerProductPriceDto.productId,
      variantId: createCustomerProductPriceDto.variantId,
    });

    return this.prisma.customerProductPrice.create({
      data: createCustomerProductPriceDto,
    });
  }

  findAll() {
    return this.prisma.customerProductPrice.findMany({
      include: {
        customer: true,
        product: true,
        variant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customerProductPrice =
      await this.prisma.customerProductPrice.findUnique({
        where: { id },
        include: {
          customer: true,
          product: true,
          variant: true,
        },
      });

    if (!customerProductPrice) {
      throw new NotFoundException('Preço específico não encontrado.');
    }

    return customerProductPrice;
  }

  async update(
    id: string,
    updateCustomerProductPriceDto: UpdateCustomerProductPriceDto,
  ) {
    const currentCustomerProductPrice = await this.findOne(id);
    const customerId =
      updateCustomerProductPriceDto.customerId ??
      currentCustomerProductPrice.customerId;
    const productId =
      updateCustomerProductPriceDto.productId ??
      currentCustomerProductPrice.productId;
    const variantId =
      updateCustomerProductPriceDto.variantId ??
      currentCustomerProductPrice.variantId ??
      undefined;

    await this.validateRelations({
      customerId,
      productId,
      variantId,
    });
    await this.ensurePriceDoesNotExist(
      {
        customerId,
        productId,
        variantId,
      },
      id,
    );

    return this.prisma.customerProductPrice.update({
      where: { id },
      data: updateCustomerProductPriceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.customerProductPrice.delete({
      where: { id },
    });
  }

  private async validateRelations({
    customerId,
    productId,
    variantId,
  }: {
    customerId?: string;
    productId?: string;
    variantId?: string;
  }) {
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado.');
      }
    }

    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }
    }

    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        select: {
          id: true,
          productId: true,
        },
      });

      if (!variant) {
        throw new NotFoundException('Variação não encontrada.');
      }

      if (productId && variant.productId !== productId) {
        throw new NotFoundException('Variação não pertence ao produto.');
      }
    }
  }

  private async ensurePriceDoesNotExist(
    {
      customerId,
      productId,
      variantId,
    }: {
      customerId: string;
      productId: string;
      variantId?: string | null;
    },
    currentId?: string,
  ) {
    const existingPrice = await this.prisma.customerProductPrice.findFirst({
      where: {
        customerId,
        productId,
        variantId: variantId ?? null,
        id: currentId
          ? {
              not: currentId,
            }
          : undefined,
      },
      select: { id: true },
    });

    if (existingPrice) {
      throw new ConflictException(
        'Já existe preço para este cliente, produto e variação.',
      );
    }
  }
}
