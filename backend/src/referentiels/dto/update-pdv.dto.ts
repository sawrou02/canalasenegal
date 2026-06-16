import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePdvDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  raisonSociale?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  secteurId?: string;

  @IsOptional()
  @IsString()
  localiteId?: string;

  @IsOptional()
  @IsNumber()
  caution?: number;

  @IsOptional()
  @IsString()
  statut?: string;
}
