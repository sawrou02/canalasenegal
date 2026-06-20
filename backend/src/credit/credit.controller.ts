import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreditService, UpsertCreditDto } from './credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
export class CreditController {
  constructor(private svc: CreditService) {}

  @Get('credits')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll();
  }

  @Get('rapport-dette')
  @UseGuards(JwtAuthGuard)
  rapportDette() {
    return this.svc.rapportDette();
  }

  @Post('credits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  upsert(@Body() dto: UpsertCreditDto) {
    return this.svc.upsert(dto);
  }
}
