import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEncaissementDto {
  @IsString()
  abonneId: string;

  @IsString()
  pdvId: string;

  @IsString()
  formuleId: string;

  @IsString()
  nature: string;

  @IsInt()
  @Min(1)
  nbMois: number;

  @IsString()
  modePaiement: string;

  @IsNumber()
  @Min(0)
  montantRecu: number;

  @IsOptional()
  @IsObject()
  options?: { premium?: boolean; intl?: boolean; timbre?: boolean };
}
