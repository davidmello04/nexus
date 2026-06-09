import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CompanySettingsService } from './company-settings.service';
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto';

const allowedLogoMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
const allowedLogoExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

@Controller('company-settings')
export class CompanySettingsController {
  constructor(
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  @Get()
  find() {
    return this.companySettingsService.find();
  }

  @Put()
  upsert(@Body() upsertCompanySettingsDto: UpsertCompanySettingsDto) {
    return this.companySettingsService.upsert(upsertCompanySettingsDto);
  }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const extension = file.originalname
          .slice(file.originalname.lastIndexOf('.'))
          .toLowerCase();
        const isAllowed =
          allowedLogoMimeTypes.includes(file.mimetype) &&
          allowedLogoExtensions.includes(extension);

        if (!isAllowed) {
          return callback(
            new BadRequestException(
              'Arquivo deve ser uma imagem png, jpg, jpeg ou webp.',
            ),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.companySettingsService.uploadLogo(file);
  }
}
