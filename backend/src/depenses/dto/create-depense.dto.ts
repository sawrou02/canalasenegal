import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDepenseDto {
  @IsString()
  date: string;

  @IsString()
  categorie: string;

  @IsString()
  motif: string;

  @IsNumber()
  @Min(0)
  montant: number;

  @IsOptional()
  @IsString()
  justificatif?: string;
}
