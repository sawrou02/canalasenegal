import { Controller, Get, UseGuards } from '@nestjs/common';
import { SecteursService } from './secteurs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('secteurs')
@UseGuards(JwtAuthGuard)
export class SecteursController {
  constructor(private secteursService: SecteursService) {}

  @Get()
  async findAll() {
    return this.secteursService.findAll();
  }
}
