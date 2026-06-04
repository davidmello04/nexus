import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolvePrice(customerId: string, productId: string, variantId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }

    const variant = variantId
      ? await this.prisma.productVariant.findUnique({
          where: { id: variantId },
        })
      : null;

    if (variantId && !variant) {
      throw new NotFoundException('Variacao nao encontrada.');
    }

    if (variant && variant.productId !== productId) {
      throw new NotFoundException('Variacao nao pertence ao produto.');
    }

    if (variantId) {
      const customerVariantPrice =
        await this.prisma.customerProductPrice.findFirst({
          where: {
            customerId,
            productId,
            variantId,
            active: true,
          },
        });

      if (customerVariantPrice) {
        return {
          price: customerVariantPrice.price,
          source: 'CUSTOMER_PRODUCT_VARIANT',
          customer,
          product,
          variant,
        };
      }
    }

    const customerProductPrice =
      await this.prisma.customerProductPrice.findFirst({
        where: {
          customerId,
          productId,
          variantId: null,
          active: true,
        },
      });

    if (customerProductPrice) {
      return {
        price: customerProductPrice.price,
        source: 'CUSTOMER_PRODUCT',
        customer,
        product,
        variant,
      };
    }

    if (customer.isOutsourced && this.hasPrice(variant?.outsourcedPrice)) {
      return {
        price: variant.outsourcedPrice,
        source: 'VARIANT_OUTSOURCED',
        customer,
        product,
        variant,
      };
    }

    if (customer.isOutsourced && this.hasPrice(product.outsourcedPrice)) {
      return {
        price: product.outsourcedPrice,
        source: 'PRODUCT_OUTSOURCED',
        customer,
        product,
        variant,
      };
    }

    if (this.hasPrice(variant?.basePrice)) {
      return {
        price: variant.basePrice,
        source: 'VARIANT_BASE',
        customer,
        product,
        variant,
      };
    }

    return {
      price: product.basePrice,
      source: 'PRODUCT_BASE',
      customer,
      product,
      variant,
    };
  }

  private hasPrice<T>(price: T | null | undefined): price is T {
    return price !== null && price !== undefined;
  }
}
