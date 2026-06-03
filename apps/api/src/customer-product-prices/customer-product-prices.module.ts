import { Module } from '@nestjs/common';
import { CustomerProductPricesController } from './customer-product-prices.controller';
import { CustomerProductPricesService } from './customer-product-prices.service';

@Module({
  controllers: [CustomerProductPricesController],
  providers: [CustomerProductPricesService],
})
export class CustomerProductPricesModule {}
