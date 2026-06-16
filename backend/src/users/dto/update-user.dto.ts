import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  pdvId?: string;

  @IsOptional()
  @IsString()
  statut?: string;
}
