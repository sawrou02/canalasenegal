import { IsString } from 'class-validator';

export class CreateLocaliteDto {
  @IsString()
  nom: string;

  @IsString()
  secteurId: string;
}
