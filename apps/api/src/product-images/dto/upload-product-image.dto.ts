import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UploadProductImageDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === false || value === undefined) {
      return value;
    }

    if (value === 'true' || value === '1') {
      return true;
    }

    if (value === 'false' || value === '0') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  isMain?: boolean;
}
