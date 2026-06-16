import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBanqueDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  numCompte?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  soldeActuel?: number;
}
