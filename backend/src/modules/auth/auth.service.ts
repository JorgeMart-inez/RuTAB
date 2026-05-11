// src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ProfileService } from '../profile/profile.service';

/**
 * Servicio de lógica de negocio para la autenticación.
 * Gestiona la validación de credenciales, comparación de hashes y emisión de tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private profileService: ProfileService,
  ) {}

  /**
   * Proceso central de inicio de sesión.
   * Utiliza el campo 'tipoAcceso' para decidir contra qué tabla de la BD validar.
   * @param loginDto - Credenciales y contexto de acceso.
   * @returns Token de acceso y perfil básico del usuario.
   */
  async login(loginDto: LoginDto) {
    const { correo, password, tipoAcceso } = loginDto;

    // --- ESCENARIO A: Acceso para Personal Administrativo (Web) ---
    if (tipoAcceso === 'ADMIN') {
      const admin = await this.prisma.administradores.findUnique({
        where: { correo },
      });

      // Validación de existencia y de integridad de contraseña mediante Bcrypt
      if (!admin) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      const fotoFirmada = await this.profileService.getSignedAvatar(
        admin.foto_perfil_url,
      );

      /**
       * Generación del Payload del JWT:
       * 'sub' (Subject) guarda el ID único del usuario para futuras consultas.
       */
      const payload = { sub: admin.id, correo: admin.correo, rol: admin.rol };

      return {
        access_token: await this.jwtService.signAsync(payload),
        tipo: 'ADMIN',
        usuario: {
          id: admin.id,
          nombre: admin.nombre,
          correo: admin.correo,
          rol: admin.rol,
          foto_perfil_url: fotoFirmada,
        },
      };
    }

    // --- ESCENARIO B: Acceso para Operadores / Choferes (App Móvil) ---
    if (tipoAcceso === 'CHOFER') {
      const chofer = await this.prisma.choferes.findUnique({
        where: { correo },
      });

      if (!chofer) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      const isPasswordValid = await bcrypt.compare(password, chofer.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      // Los choferes se marcan con un rol estático 'CHOFER' para el sistema de Guards (RBAC)
      const payload = { sub: chofer.id, correo: chofer.correo, rol: 'chofer' };

      return {
        access_token: await this.jwtService.signAsync(payload),
        tipo: 'CHOFER',
        usuario: {
          id: chofer.id,
          nombre: chofer.nombre,
          correo: chofer.correo,
          licencia: chofer.licencia,
          telefono: chofer.telefono,
          foto_perfil_url: chofer.foto_perfil_url,
          rol: 'chofer',
        },
      };
    }

    // Fallback de seguridad para tipos de acceso no contemplados
    throw new UnauthorizedException('Petición de inicio de sesión inválida');
  }

  /**
   * Recupera la información detallada del usuario a partir de los datos del token.
   * Utilizado para "re-hidratar" la sesión en el Frontend.
   */
  async getProfile(userId: string, rol: string) {
    // Lógica de recuperación para perfiles administrativos
    if (rol !== 'chofer') {
      const admin = await this.prisma.administradores.findUnique({
        where: { id: userId },
      });

      if (!admin) throw new UnauthorizedException('Usuario no encontrado');

      const fotoFirmada = await this.profileService.getSignedAvatar(
        admin.foto_perfil_url,
      );

      return {
        id: admin.id,
        nombre: admin.nombre,
        correo: admin.correo,
        rol: admin.rol,
        foto_perfil_url: fotoFirmada,
      };
    }

    // Lógica de recuperación para perfiles de operadores
    const chofer = await this.prisma.choferes.findUnique({
      where: { id: userId },
    });

    if (!chofer) throw new UnauthorizedException('Chofer no encontrado');

    return {
      id: chofer.id,
      nombre: chofer.nombre,
      correo: chofer.correo,
      rol: 'chofer',
      foto_perfil_url: chofer.foto_perfil_url,
    };
  }
}
