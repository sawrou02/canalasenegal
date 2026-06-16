import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEntrepotDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  capacite?: number;

  @IsOptional()
  @IsString()
  statut?: string;
}
