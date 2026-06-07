import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    await this.ensureCategoryExists(createProductDto.categoryId);

    return this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
        customPrices: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    await this.ensureCategoryExists(updateProductDto.categoryId);

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const [orderItemsCount, variantsCount, customPricesCount, imagesCount] =
      await Promise.all([
        this.prisma.orderItem.count({
          where: {
            productId: id,
          },
        }),
        this.prisma.productVariant.count({
          where: {
            productId: id,
          },
        }),
        this.prisma.customerProductPrice.count({
          where: {
            productId: id,
          },
        }),
        this.prisma.productImage.count({
          where: {
            productId: id,
          },
        }),
      ]);

    if (orderItemsCount > 0) {
      throw new BadRequestException(
        'Este produto possui pedidos vinculados e não pode ser excluído. Inative o produto para manter o histórico.',
      );
    }

    if (variantsCount > 0) {
      throw new BadRequestException(
        'Este produto possui variações vinculadas e não pode ser excluído. Remova ou inative as variações antes de excluir o produto.',
      );
    }

    if (customPricesCount > 0) {
      throw new BadRequestException(
        'Este produto possui preços específicos vinculados e não pode ser excluído. Remova os preços específicos antes de excluir o produto.',
      );
    }

    if (imagesCount > 0) {
      throw new BadRequestException(
        'Este produto possui imagens vinculadas e não pode ser excluído. Remova as imagens antes de excluir o produto.',
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  private async ensureCategoryExists(categoryId?: string) {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }
  }
}
