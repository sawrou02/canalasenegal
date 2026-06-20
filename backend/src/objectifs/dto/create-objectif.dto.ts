import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateObjectifDto {
  @IsOptional()
  @IsString()
  pdvId?: string;

  @IsString()
  typeObjectif: string; // RECRUTEMENT | REABO | MIGRATION | CA

  @IsNumber()
  @Min(0)
  cible: number;

  @IsString()
  periode: string; // YYYY-MM
}

export class UpdateObjectifDto {
  @IsOptional()
  @IsString()
  pdvId?: string;

  @IsOptional()
  @IsString()
  typeObjectif?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cible?: number;

  @IsOptional()
  @IsString()
  periode?: string;
}
