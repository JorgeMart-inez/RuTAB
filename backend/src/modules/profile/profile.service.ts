import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  private supabase;

  constructor(private prisma: PrismaService) {
    // Inicializamos el cliente de Supabase con Service Role Key para bypass de RLS
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  /**
   * Actualiza los datos de texto del administrador.
   * Garantiza que la foto de perfil se devuelva siempre como una URL firmada.
   */
  async update(adminId: string, updateProfileDto: UpdateProfileDto) {
    const data: any = { ...updateProfileDto };

    // Si el usuario envió una nueva contraseña, la hasheamos
    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    try {
      // 1. Realizamos la actualización en la BD
      const admin = await this.prisma.administradores.update({
        where: { id: adminId },
        data,
        select: {
          id: true,
          nombre: true,
          correo: true,
          telefono: true,
          rol: true,
          foto_perfil_url: true, // Esto es el PATH (ej: avatars/admins/...)
        },
      });

      // 2. Firmamos la URL antes de enviarla al frontend para que no se rompa la imagen
      if (admin.foto_perfil_url) {
        admin.foto_perfil_url = await this.getSignedAvatar(
          admin.foto_perfil_url,
        );
      }

      return admin;
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el perfil');
    }
  }

  /**
   * Genera una URL temporal (firmada) para visualizar archivos privados
   */
  async getSignedAvatar(path: string) {
    if (!path) return null;

    const { data, error } = await this.supabase.storage
      .from('perfiles')
      .createSignedUrl(path, 3600); // El link dura 1 hora

    if (error) {
      console.error('Error al firmar URL:', error.message);
      return null;
    }
    return data.signedUrl;
  }

  /**
   * Sube una nueva imagen, elimina la anterior del bucket y actualiza la BD
   */
  async uploadAvatar(adminId: string, file: Express.Multer.File) {
    // 1. Buscamos el perfil actual para limpieza
    const adminActual = await this.prisma.administradores.findUnique({
      where: { id: adminId },
      select: { foto_perfil_url: true },
    });

    // 2. Eliminamos la imagen anterior si existe para no acumular basura
    if (adminActual?.foto_perfil_url) {
      try {
        await this.supabase.storage
          .from('perfiles')
          .remove([adminActual.foto_perfil_url]);
      } catch (err) {
        console.error('Error al limpiar imagen anterior:', err);
      }
    }

    // 3. Subimos la nueva imagen
    const filePath = `avatars/admins/${adminId}-${Date.now()}.webp`;

    const { error: uploadError } = await this.supabase.storage
      .from('perfiles')
      .upload(filePath, file.buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error de Supabase al subir:', uploadError);
      throw new InternalServerErrorException(
        `Error al subir: ${uploadError.message}`,
      );
    }

    // 4. Guardamos el nuevo PATH en la base de datos
    await this.prisma.administradores.update({
      where: { id: adminId },
      data: { foto_perfil_url: filePath },
    });

    // 5. Retornamos la URL firmada para refrescar la UI inmediatamente
    const signedUrl = await this.getSignedAvatar(filePath);
    return { foto_perfil_url: signedUrl };
  }
}
