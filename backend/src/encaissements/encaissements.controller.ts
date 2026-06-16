import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EncaissementsService } from './encaissements.service';
import { CreateEncaissementDto } from './dto/create-encaissement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('encaissements')
export class EncaissementsController {
  constructor(private encaissementsService: EncaissementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateEncaissementDto, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.encaissementsService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('pdvId') pdvId?: string) {
    return this.encaissementsService.findAll(pdvId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.encaissementsService.findOne(id);
  }
}
