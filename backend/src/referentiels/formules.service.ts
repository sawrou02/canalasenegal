import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormuleDto } from './dto/create-formule.dto';
import { UpdateFormuleDto } from './dto/update-formule.dto';

@Injectable()
export class FormulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.formule.findMany({
      orderBy: { prixFormule: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.formule.findUnique({ where: { id } });
  }

  async create(dto: CreateFormuleDto) {
    return this.prisma.formule.create({ data: dto });
  }

  async update(id: string, dto: UpdateFormuleDto) {
    return this.prisma.formule.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.formule.update({
      where: { id },
      data: { statut: 'INACTIF' },
    });
  }
}
