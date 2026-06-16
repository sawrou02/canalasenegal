import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFormuleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nomCommercial?: string;

  @IsOptional()
  @IsNumber()
  prixMateriel?: number;

  @IsOptional()
  @IsNumber()
  prixFormule?: number;

  @IsOptional()
  @IsString()
  statut?: string;
}
