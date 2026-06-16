import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCommissions(@Query('periode') periode?: string) {
    return this.commissionsService.getCommissions(periode);
  }
}
