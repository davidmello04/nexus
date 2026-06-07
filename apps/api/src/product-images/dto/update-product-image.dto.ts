import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
