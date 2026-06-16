import { IsNumber, IsString } from 'class-validator';

export class CreateEntrepotDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsString()
  type: string;

  @IsNumber()
  capacite: number;
}
