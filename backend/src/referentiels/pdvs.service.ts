import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePdvDto } from './dto/create-pdv.dto';
import { UpdatePdvDto } from './dto/update-pdv.dto';

@Injectable()
export class PdvsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string, statut?: string) {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (statut) {
      where.statut = statut;
    }

    return this.prisma.pDV.findMany({
      where,
      include: {
        secteur: { select: { nom: true } },
        localite: { select: { nom: true } },
        _count: { select: { users: true, abonnes: true } },
      },
      orderBy: { raisonSociale: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.pDV.findUnique({
      where: { id },
      include: {
        secteur: { select: { nom: true } },
        localite: { select: { nom: true } },
        users: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            statut: true,
          },
        },
      },
    });
  }

  async create(dto: CreatePdvDto) {
    return this.prisma.pDV.create({ data: dto as any });
  }

  async update(id: string, dto: UpdatePdvDto) {
    return this.prisma.pDV.update({
      where: { id },
      data: dto as any,
    });
  }
}
