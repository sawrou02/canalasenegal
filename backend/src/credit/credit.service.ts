import { Injectable } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class UpsertCreditDto {
  @IsString()
  pdvId: string;

  @IsNumber()
  @Min(0)
  plafond: number;

  @IsOptional()
  @IsNumber()
  avoir?: number;

  @IsOptional()
  @IsNumber()
  dette?: number;
}

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  private async withComputed() {
    const credits = await this.prisma.credit.findMany({
      include: { pdv: { select: { code: true, raisonSociale: true } } },
      orderBy: { dette: 'desc' },
    });
    return credits.map((c) => ({
      ...c,
      encours: c.dette,
      creditDispo: c.plafond + c.avoir - c.dette,
    }));
  }

  findAll() {
    return this.withComputed();
  }

  async rapportDette() {
    const all = await this.withComputed();
    return all.filter((c) => c.dette > 0);
  }

  upsert(dto: UpsertCreditDto) {
    return this.prisma.credit.upsert({
      where: { pdvId: dto.pdvId },
      create: { pdvId: dto.pdvId, plafond: dto.plafond, avoir: dto.avoir ?? 0, dette: dto.dette ?? 0 },
      update: { plafond: dto.plafond, avoir: dto.avoir, dette: dto.dette },
    });
  }
}
