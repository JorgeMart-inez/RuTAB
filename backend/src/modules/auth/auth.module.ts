// src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileModule } from '../profile/profile.module';

/**
 * Módulo de Autenticación.
 * Centraliza la configuración de Passport, la firma de tokens JWT y la
 * inicialización de las estrategias de seguridad.
 */
@Module({
  imports: [
    /**
     * PassportModule: Provee las utilidades básicas para manejar diferentes
     * estrategias de autenticación en NestJS.
     */
    PassportModule,

    /**
     * JwtModule: Configuración del motor de firma y verificación de tokens.
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    ProfileModule,
  ],
  controllers: [AuthController],
  /**
   * Proveedores: Incluye el AuthService (lógica de negocio) y la JwtStrategy
   * para que el motor de Passport pueda interceptar y validar los Bearer Tokens.
   */
  providers: [AuthService, JwtStrategy],
  /**
   * Exportaciones: Permite que otros módulos de la aplicación utilicen los
   * mecanismos de protección de rutas (@UseGuards) sin re-configurar el JWT.
   */
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
