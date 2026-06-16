import { Module } from '@nestjs/common';
import { AbonnesController } from './abonnes.controller';
import { AbonnesService } from './abonnes.service';

@Module({
  controllers: [AbonnesController],
  providers: [AbonnesService],
})
export class AbonnesModule {}
