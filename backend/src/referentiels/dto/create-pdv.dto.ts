import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePdvDto {
  @IsString()
  code: string;

  @IsString()
  raisonSociale: string;

  @IsString()
  type: string;

  @IsString()
  secteurId: string;

  @IsString()
  localiteId: string;

  @IsOptional()
  @IsNumber()
  caution?: number;
}
