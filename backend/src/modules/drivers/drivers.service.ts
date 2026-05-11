import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateDriverDto } from './dto/create-drivers.dto';
import * as bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class DriversService {
  private supabase;
  private readonly BUCKET_NAME = 'perfiles';

  constructor(private prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  /**
   * Extrae la ruta del archivo (path) de una URL de Supabase.
   * Necesaria porque para borrar se requiere el path, no la URL completa.
   */
  private extractPathFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      // Las URLs de Supabase suelen tener el formato: .../object/sign/perfiles/avatars/choferes/archivo.webp?token=...
      // Buscamos la parte que sigue al nombre del bucket
      const parts = url.split(`${this.BUCKET_NAME}/`);
      if (parts.length < 2) return null;

      // El path es lo que está después del bucket y antes de los parámetros de consulta (?)
      return parts[1].split('?')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Borra un archivo físicamente de Supabase Storage
   */
  private async deleteFileFromStorage(url: string) {
    const path = this.extractPathFromUrl(url);
    if (!path) return;

    const { error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error(
        `Error al borrar archivo antiguo (${path}):`,
        error.message,
      );
      // No lanzamos excepción aquí para no bloquear el flujo principal si el archivo ya no existía
    }
  }

  async create(createDriverDto: CreateDriverDto) {
    const { correo, password, ...rest } = createDriverDto;

    const correoExistente = await this.prisma.choferes.findUnique({
      where: { correo },
    });

    if (correoExistente) {
      throw new ConflictException('Este correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password || '123456', saltRounds);

    return this.prisma.choferes.create({
      data: {
        ...rest,
        correo,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.choferes.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const driver = await this.prisma.choferes.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Chofer no encontrado.');
    return driver;
  }

  async update(id: string, updateDto: Partial<CreateDriverDto>) {
    const driverActual = await this.prisma.choferes.findUnique({
      where: { id },
    });
    if (!driverActual) throw new NotFoundException('Chofer no encontrado.');

    const dataToUpdate: any = { ...updateDto };

    // --- Lógica de borrado de foto antigua ---
    if (updateDto.foto_perfil_url && driverActual.foto_perfil_url) {
      // Si la URL nueva es diferente a la actual, borramos la vieja del Storage
      if (updateDto.foto_perfil_url !== driverActual.foto_perfil_url) {
        await this.deleteFileFromStorage(driverActual.foto_perfil_url);
      }
    }

    if (updateDto.password) {
      const saltRounds = 10;
      dataToUpdate.password = await bcrypt.hash(updateDto.password, saltRounds);
    } else {
      delete dataToUpdate.password;
    }

    return this.prisma.choferes.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    const driver = await this.prisma.choferes.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Chofer no encontrado.');

    // Borramos la foto del storage antes de eliminar el registro
    if (driver.foto_perfil_url) {
      await this.deleteFileFromStorage(driver.foto_perfil_url);
    }

    return this.prisma.choferes.delete({ where: { id } });
  }

  async uploadAvatar(file: Express.Multer.File) {
    const fileName = `avatars/choferes/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

    const { data, error: uploadError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error detallado de Supabase:', uploadError);
      throw new InternalServerErrorException(
        `Supabase Upload Error: ${uploadError.message}`,
      );
    }

    // Generar URL Firmada por 10 años
    const { data: signedData, error: signedError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(fileName, 315360000);

    if (signedError) {
      throw new InternalServerErrorException(
        'No se pudo generar la URL firmada',
      );
    }

    return { foto_perfil_url: signedData.signedUrl };
  }
}
