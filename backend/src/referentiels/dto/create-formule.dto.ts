import { IsNumber, IsString } from 'class-validator';

export class CreateFormuleDto {
  @IsString()
  code: string;

  @IsString()
  nomCommercial: string;

  @IsNumber()
  prixMateriel: number;

  @IsNumber()
  prixFormule: number;
}
