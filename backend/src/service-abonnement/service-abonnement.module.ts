import { Module } from '@nestjs/common';
import { ServiceAbonnementController } from './service-abonnement.controller';
import { ServiceAbonnementService } from './service-abonnement.service';

@Module({
  controllers: [ServiceAbonnementController],
  providers: [ServiceAbonnementService],
})
export class ServiceAbonnementModule {}
