import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto';

@Injectable()
export class CompanySettingsService {
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
}
