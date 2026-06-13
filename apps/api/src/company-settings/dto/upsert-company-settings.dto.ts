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

  @IsOptional()
  @IsString()
  @MaxLength(20)
  addressZipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  addressStreet?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  addressNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  addressComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressNeighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  addressState?: string;

  @IsString()
  defaultOrderMessage!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
