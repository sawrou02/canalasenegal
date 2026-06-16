import { IsOptional, IsString } from 'class-validator';

export class UpdateLocaliteDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  secteurId?: string;
}
