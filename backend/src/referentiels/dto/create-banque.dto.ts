import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBanqueDto {
  @IsString()
  nom: string;

  @IsString()
  numCompte: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  soldeActuel?: number;
}
