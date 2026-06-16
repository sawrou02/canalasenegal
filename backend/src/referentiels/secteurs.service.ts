import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecteursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.secteur.findMany({
      include: { _count: { select: { localites: true, pdvs: true } } },
      orderBy: { nom: 'asc' },
    });
  }
}
