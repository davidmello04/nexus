import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResolvePriceQueryDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;
}
