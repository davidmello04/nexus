import { Controller, Get, Query } from '@nestjs/common';
import { ResolvePriceQueryDto } from './dto/resolve-price-query.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('resolve')
  resolvePrice(@Query() resolvePriceQueryDto: ResolvePriceQueryDto) {
    return this.pricingService.resolvePrice(
      resolvePriceQueryDto.customerId,
      resolvePriceQueryDto.productId,
      resolvePriceQueryDto.variantId,
    );
  }
}
