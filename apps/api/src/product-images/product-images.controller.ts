import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { ProductImagesService } from './product-images.service';

const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

@Controller('product-images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post('upload/:productId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const extension = file.originalname
          .slice(file.originalname.lastIndexOf('.'))
          .toLowerCase();
        const isAllowed =
          allowedImageMimeTypes.includes(file.mimetype) &&
          allowedImageExtensions.includes(extension);

        if (!isAllowed) {
          return callback(
            new BadRequestException(
              'Arquivo deve ser uma imagem jpg, jpeg, png ou webp.',
            ),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  upload(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() uploadProductImageDto: UploadProductImageDto,
  ) {
    return this.productImagesService.upload(
      productId,
      file,
      uploadProductImageDto,
    );
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.productImagesService.findByProduct(productId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductImageDto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(id, updateProductImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productImagesService.remove(id);
  }
}
