import { Body, Controller, Get, Put } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto';

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
}
