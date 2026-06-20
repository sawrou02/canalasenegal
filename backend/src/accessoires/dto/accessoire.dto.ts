import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAccessoireDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsNumber()
  @Min(0)
  prixUnitaire: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockEntrepot?: number;
}

export class UpdateAccessoireDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  @IsOptional()
  @IsString()
  statut?: string;
}

export class ApproDto {
  @IsString()
  accessoireId: string;

  @IsInt()
  @Min(1)
  quantite: number;
}

export class LivraisonDto {
  @IsString()
  accessoireId: string;

  @IsString()
  pdvId: string;

  @IsInt()
  @Min(1)
  quantite: number;
}

export class VenteDto {
  @IsString()
  accessoireId: string;

  @IsString()
  pdvId: string;

  @IsInt()
  @Min(1)
  quantite: number;
}

export class RetourDto {
  @IsString()
  accessoireId: string;

  @IsString()
  pdvId: string;

  @IsInt()
  @Min(1)
  quantite: number;

  @IsString()
  motif: string;
}
