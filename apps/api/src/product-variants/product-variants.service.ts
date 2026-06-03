import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductVariantDto: CreateProductVariantDto) {
    await this.ensureProductExists(createProductVariantDto.productId);

    return this.prisma.productVariant.create({
      data: createProductVariantDto,
    });
  }

  findAll() {
    return this.prisma.productVariant.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const productVariant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!productVariant) {
      throw new NotFoundException('Variacao nao encontrada.');
    }

    return productVariant;
  }

  async update(id: string, updateProductVariantDto: UpdateProductVariantDto) {
    await this.findOne(id);
    await this.ensureProductExists(updateProductVariantDto.productId);

    return this.prisma.productVariant.update({
      where: { id },
      data: updateProductVariantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  private async ensureProductExists(productId?: string) {
    if (!productId) {
      return;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado.');
    }
  }
}
