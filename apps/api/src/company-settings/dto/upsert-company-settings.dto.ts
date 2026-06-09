import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertCompanySettingsDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(50)
  phone!: string;

  @IsString()
  @MaxLength(50)
  whatsapp!: string;

  @IsString()
  @MaxLength(100)
  instagram!: string;

  @IsString()
  @MaxLength(50)
  document!: string;

  @IsString()
  address!: string;

  @IsString()
  defaultOrderMessage!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
