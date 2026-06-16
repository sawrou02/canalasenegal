import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ABONNE_INCLUDE = {
  formule: {
    select: { id: true, code: true, nomCommercial: true, prixFormule: true },
  },
  pdv: { select: { id: true, raisonSociale: true } },
  decodeur: { select: { numSerie: true, type: true } },
};

@Injectable()
export class AbonnesService {
  constructor(private prisma: PrismaService) {}

  async search(q?: string) {
    const where: any = {};
    if (q) {
      where.OR = [
        { numAbonne: { contains: q, mode: 'insensitive' } },
        { nom: { contains: q, mode: 'insensitive' } },
        { prenom: { contains: q, mode: 'insensitive' } },
        { tel1: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.abonne.findMany({
      where,
      include: ABONNE_INCLUDE,
      orderBy: { nom: 'asc' },
      take: 20,
    });
  }

  async findOne(id: string) {
    return this.prisma.abonne.findUnique({
      where: { id },
      include: ABONNE_INCLUDE,
    });
  }
}
