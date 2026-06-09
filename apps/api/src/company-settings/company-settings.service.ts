import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto';

@Injectable()
export class CompanySettingsService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'company');

  constructor(private readonly prisma: PrismaService) {}

  find() {
    return this.findFirst();
  }

  async upsert(upsertCompanySettingsDto: UpsertCompanySettingsDto) {
    const currentSettings = await this.findFirst();
    const data = this.normalizeData(upsertCompanySettingsDto);

    if (currentSettings) {
      return this.prisma.companySettings.update({
        where: { id: currentSettings.id },
        data,
      });
    }

    return this.prisma.companySettings.create({
      data,
    });
  }

  async uploadLogo(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Logo é obrigatória.');
    }

    await mkdir(this.uploadDir, { recursive: true });

    const currentSettings = await this.findFirst();
    const extension = extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = join(this.uploadDir, filename);
    const logoUrl = `/uploads/company/${filename}`;

    await writeFile(filePath, file.buffer);

    try {
      const settings = currentSettings
        ? await this.prisma.companySettings.update({
            where: { id: currentSettings.id },
            data: { logoUrl },
          })
        : await this.prisma.companySettings.create({
            data: {
              name: '',
              phone: '',
              whatsapp: '',
              instagram: '',
              document: '',
              address: '',
              defaultOrderMessage: '',
              logoUrl,
            },
          });

      if (currentSettings?.logoUrl) {
        await this.tryRemoveFile(this.getFilePathFromUrl(currentSettings.logoUrl));
      }

      return settings;
    } catch (error) {
      await this.tryRemoveFile(filePath);
      throw error;
    }
  }

  findFirst() {
    return this.prisma.companySettings.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private normalizeData(upsertCompanySettingsDto: UpsertCompanySettingsDto) {
    return {
      name: upsertCompanySettingsDto.name,
      phone: upsertCompanySettingsDto.phone,
      whatsapp: upsertCompanySettingsDto.whatsapp,
      instagram: upsertCompanySettingsDto.instagram,
      document: upsertCompanySettingsDto.document,
      address: upsertCompanySettingsDto.address,
      defaultOrderMessage: upsertCompanySettingsDto.defaultOrderMessage,
      logoUrl: upsertCompanySettingsDto.logoUrl || undefined,
    };
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
