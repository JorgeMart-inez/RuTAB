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
    // Inicializamos el cliente de Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  async update(adminId: string, updateProfileDto: UpdateProfileDto) {
    const data: any = { ...updateProfileDto };

    // Si el usuario envió una nueva contraseña, la hasheamos
    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    try {
      return await this.prisma.administradores.update({
        where: { id: adminId },
        data,
        select: {
          id: true,
          nombre: true,
          correo: true,
          telefono: true,
          rol: true,
          foto_perfil_url: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el perfil');
    }
  }

  async getSignedAvatar(path: string) {
    if (!path) return null;

    const { data, error } = await this.supabase.storage
      .from('perfiles')
      .createSignedUrl(path, 3600); // El link dura 1 hora

    if (error) return null;
    return data.signedUrl;
  }

  async uploadAvatar(adminId: string, file: Express.Multer.File) {
    const filePath = `avatars/${adminId}-${Date.now()}.webp`;

    await this.supabase.storage
      .from('perfiles')
      .upload(filePath, file.buffer, { upsert: true });

    // Guardamos solo el PATH (ej: "avatars/id-123.webp")
    await this.prisma.administradores.update({
      where: { id: adminId },
      data: { foto_perfil_url: filePath },
    });

    // Retornamos la firmada para que el frontend la vea de inmediato
    return { foto_perfil_url: await this.getSignedAvatar(filePath) };
  }
}
