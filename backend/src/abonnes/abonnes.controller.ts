import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AbonnesService } from './abonnes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('abonnes')
export class AbonnesController {
  constructor(private abonnesService: AbonnesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') q?: string) {
    return this.abonnesService.search(q);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.abonnesService.findOne(id);
  }
}
