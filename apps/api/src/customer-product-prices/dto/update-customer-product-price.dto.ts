import { PartialType } from '@nestjs/swagger';
import { CreateCustomerProductPriceDto } from './create-customer-product-price.dto';

export class UpdateCustomerProductPriceDto extends PartialType(
  CreateCustomerProductPriceDto,
) {}
