import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { RapportsService } from './rapports.service';
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

@Controller()
export class RapportsController {
  constructor(private rapportsService: RapportsService) {}

  @Get('rapports')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.rapportsService.findAll();
  }

  @Get('rapports/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.rapportsService.getStats();
  }

  @Post('rapports/preview')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni (champ "file").');
    }
    return this.rapportsService.preview(file.buffer, file.originalname);
  }

  @Post('rapports/import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni (champ "file").');
    }
    const userId = (req.user as any).userId;
    return this.rapportsService.import(
      file.buffer,
      file.originalname,
      userId,
      getIp(req),
    );
  }

  @Patch('rapports/:id/matcher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  async matcher(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.rapportsService.matcher(id, userId, getIp(req));
  }

  @Get('matching')
  @UseGuards(JwtAuthGuard)
  async matching(@Query('date') date: string) {
    if (!date) {
      throw new BadRequestException(
        'Paramètre "date" requis (format YYYY-MM-DD).',
      );
    }
    return this.rapportsService.matching(date);
  }
}
