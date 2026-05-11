import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../jwt.strategy';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { PrismaModule } from 'src/database/prisma/prisma.module'; // Importamos el módulo de Prisma

@Module({
  imports: [
    PrismaModule, // <--- Obligatorio para que el Service pueda usar this.prisma
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secreto_temporal',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [DriversController],
  providers: [DriversService, JwtStrategy],
  exports: [PassportModule, JwtStrategy],
})
export class DriversModule {}
