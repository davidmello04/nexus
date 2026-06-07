import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { UploadProductImageDto } from './dto/upload-product-image.dto';

@Injectable()
export class ProductImagesService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    productId: string,
    file: Express.Multer.File | undefined,
    uploadProductImageDto: UploadProductImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Imagem e obrigatoria.');
    }

    await this.ensureProductExists(productId);
    await mkdir(this.uploadDir, { recursive: true });

    const extension = extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = join(this.uploadDir, filename);
    const url = `/uploads/products/${filename}`;

    await writeFile(filePath, file.buffer);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (uploadProductImageDto.isMain) {
          await tx.productImage.updateMany({
            where: { productId },
            data: { isMain: false },
          });
        }

        return tx.productImage.create({
          data: {
            url,
            alt: uploadProductImageDto.alt,
            isMain: uploadProductImageDto.isMain,
            productId,
          },
        });
      });
    } catch (error) {
      await this.tryRemoveFile(filePath);
      throw error;
    }
  }

  async findByProduct(productId: string) {
    await this.ensureProductExists(productId);

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, updateProductImageDto: UpdateProductImageDto) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (updateProductImageDto.isMain === true) {
        await tx.productImage.updateMany({
          where: {
            productId: image.productId,
            id: {
              not: id,
            },
          },
          data: {
            isMain: false,
          },
        });
      }

      return tx.productImage.update({
        where: { id },
        data: updateProductImageDto,
      });
    });
  }

  async remove(id: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada.');
    }

    const deletedImage = await this.prisma.productImage.delete({
      where: { id },
    });

    await this.tryRemoveFile(this.getFilePathFromUrl(image.url));

    return deletedImage;
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }
  }

  private getFilePathFromUrl(url: string) {
    const filename = url.split('/').at(-1);

    if (!filename) {
      return '';
    }

    return join(this.uploadDir, filename);
  }

  private async tryRemoveFile(filePath: string) {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      return;
    }
  }
}
