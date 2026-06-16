import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { AbonnesModule } from './abonnes/abonnes.module';
import { EncaissementsModule } from './encaissements/encaissements.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    ReferentielsModule,
    AbonnesModule,
    EncaissementsModule,
  ],
})
export class AppModule {}
