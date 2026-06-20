import { BadRequestException, Injectable } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { computePdvSolde } from '../domain/calculations';

export class CreateArreteDto {
  @IsString()
  pdvId: string;

  @IsString()
  periode: string; // YYYY-MM
}

@Injectable()
export class ArretesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.arreteSolde.findMany({
      include: { pdv: { select: { code: true, raisonSociale: true } } },
      orderBy: { dateArrete: 'desc' },
    });
  }

  /** Business rule #7: a closing is forbidden while versements are still pending. */
  async create(dto: CreateArreteDto, userId: string, ip: string) {
    const pending = await this.prisma.versement.count({
      where: { pdvId: dto.pdvId, statut: 'ENATTENTE' },
    });
    if (pending > 0) {
      throw new BadRequestException(
        `Arrêté impossible : ${pending} versement(s) en attente de validation pour ce PDV`,
      );
    }
    const [enc, vers] = await Promise.all([
      this.prisma.encaissement.aggregate({ where: { pdvId: dto.pdvId }, _sum: { montantTotal: true } }),
      this.prisma.versement.aggregate({
        where: { pdvId: dto.pdvId, statut: 'VALIDE' },
        _sum: { montant: true },
      }),
    ]);
    const soldeFige = computePdvSolde(enc._sum.montantTotal || 0, vers._sum.montant || 0);
    const created = await this.prisma.arreteSolde.create({
      data: { pdvId: dto.pdvId, periode: dto.periode, soldeFige, statut: 'SIGNE' },
    });
    await this.audit.log(userId, 'ARRETE_SOLDE', 'FINANCES', ip);
    return created;
  }
}
