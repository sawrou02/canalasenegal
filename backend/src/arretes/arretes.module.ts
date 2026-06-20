import { Module } from '@nestjs/common';
import { ArretesController } from './arretes.controller';
import { ArretesService } from './arretes.service';

@Module({
  controllers: [ArretesController],
  providers: [ArretesService],
})
export class ArretesModule {}
