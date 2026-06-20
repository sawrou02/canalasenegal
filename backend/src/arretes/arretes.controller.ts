import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ArretesService, CreateArreteDto } from './arretes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

@Controller('arretes')
export class ArretesController {
  constructor(private svc: ArretesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.COMPTABLE)
  create(@Body() dto: CreateArreteDto, @Req() req: Request) {
    return this.svc.create(dto, (req.user as any).userId, getIp(req));
  }
}
