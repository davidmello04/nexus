import { Module } from '@nestjs/common';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { PricingModule } from '../pricing/pricing.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PricingModule, CompanySettingsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
