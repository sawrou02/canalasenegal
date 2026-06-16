import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FormulesService } from './formules.service';
import { CreateFormuleDto } from './dto/create-formule.dto';
import { UpdateFormuleDto } from './dto/update-formule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('formules')
export class FormulesController {
  constructor(private formulesService: FormulesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.formulesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.formulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async create(@Body() dto: CreateFormuleDto) {
    return this.formulesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateFormuleDto) {
    return this.formulesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string) {
    return this.formulesService.remove(id);
  }
}
