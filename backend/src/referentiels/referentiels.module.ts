import { Module } from '@nestjs/common';
import { SecteursController } from './secteurs.controller';
import { SecteursService } from './secteurs.service';
import { LocalitesController } from './localites.controller';
import { LocalitesService } from './localites.service';
import { FormulesController } from './formules.controller';
import { FormulesService } from './formules.service';
import { BanquesController } from './banques.controller';
import { BanquesService } from './banques.service';
import { EntrepotsController } from './entrepots.controller';
import { EntrepotsService } from './entrepots.service';
import { PdvsController } from './pdvs.controller';
import { PdvsService } from './pdvs.service';

@Module({
  controllers: [
    SecteursController,
    LocalitesController,
    FormulesController,
    BanquesController,
    EntrepotsController,
    PdvsController,
  ],
  providers: [
    SecteursService,
    LocalitesService,
    FormulesService,
    BanquesService,
    EntrepotsService,
    PdvsService,
  ],
})
export class ReferentielsModule {}
