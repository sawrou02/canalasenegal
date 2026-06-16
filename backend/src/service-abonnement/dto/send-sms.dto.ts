import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendSmsDto {
  @IsArray()
  @IsString({ each: true })
  abonneIds: string[];

  @IsOptional()
  @IsString()
  message?: string;
}
