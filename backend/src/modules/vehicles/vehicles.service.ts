import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'vehiculos';

  constructor(private prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  private extractFileName(url: string | null): string | null {
    if (!url) return null;
    const parts = url.split('/');
    return parts.pop() || null;
  }

  /**
   * Sube la imagen a Supabase con logs de seguimiento
   */
  private async uploadImageToStorage(
    file: Express.Multer.File,
    placas: string,
  ): Promise<string> {
    const fileName = `${placas.toLowerCase()}-${Date.now()}.webp`;

    console.log(
      `🚀 [Storage] Intentando subir archivo: ${fileName} (${file.size} bytes)`,
    );

    // Forzamos el envío del buffer directo asegurando el Content-Type WebP
    const { data, error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('❌ [Storage Error] Supabase rechazó la subida:', error);
      throw new BadRequestException(
        `Fallo en Supabase Storage: ${error.message}`,
      );
    }

    console.log(
      '✅ [Storage] Archivo guardado con éxito. Data devuelta:',
      data,
    );

    const { data: urlData } = this.supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  private async deleteImageFromStorage(imageUrl: string | null) {
    const fileName = this.extractFileName(imageUrl);
    if (!fileName) return;

    console.log(`🗑️ [Storage] Eliminando archivo antiguo: ${fileName}`);
    const { error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error(
        `⚠️ [Storage Error] No se pudo borrar ${fileName}:`,
        error.message,
      );
    } else {
      console.log(`✅ [Storage] Archivo eliminado del bucket.`);
    }
  }

  private sanitizeDataForPrisma(
    dto: Partial<CreateVehicleDto>,
    fotoUrl?: string,
  ) {
    const prismaData: any = {};
    if (dto.placas) prismaData.placas = dto.placas.trim();
    if (dto.marca) prismaData.marca = dto.marca.trim();
    if (dto.modelo) prismaData.modelo = dto.modelo.trim();
    if (dto.estatus) prismaData.estatus = dto.estatus;

    if (
      dto.rendimiento_combustible !== undefined &&
      dto.rendimiento_combustible !== null
    ) {
      const parsedRendimiento = parseFloat(
        dto.rendimiento_combustible.toString(),
      );
      prismaData.rendimiento_combustible = isNaN(parsedRendimiento)
        ? null
        : parsedRendimiento;
    }

    if (fotoUrl !== undefined) {
      prismaData.foto_unidad_url = fotoUrl;
    }
    return prismaData;
  }

  // --- INTERFACES CRUD ---

  async create(data: CreateVehicleDto, file?: Express.Multer.File) {
    console.log(
      '📥 [POST /vehicles] Petición recibida. ¿Viene archivo?:',
      !!file,
    );

    const existe = await this.prisma.vehiculos.findUnique({
      where: { placas: data.placas },
    });
    if (existe) throw new ConflictException('Las placas ya están registradas');

    let fotoUrl = data.foto_unidad_url;

    if (file) {
      fotoUrl = await this.uploadImageToStorage(file, data.placas);
    }

    const cleanData = this.sanitizeDataForPrisma(data, fotoUrl);
    return this.prisma.vehiculos.create({ data: cleanData });
  }

  async findAll() {
    return this.prisma.vehiculos.findMany();
  }

  async findOne(id: string) {
    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    return vehiculo;
  }

  async update(
    id: string,
    data: Partial<CreateVehicleDto>,
    file?: Express.Multer.File,
  ) {
    console.log(
      `📥 [PATCH /vehicles/${id}] Petición recibida. ¿Viene archivo?:`,
      !!file,
    );

    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    let fotoUrl = data.foto_unidad_url;

    if (file) {
      // Si ya existía una foto en la base de datos, la purgamos del Storage
      if (vehiculo.foto_unidad_url) {
        await this.deleteImageFromStorage(vehiculo.foto_unidad_url);
      }
      const placasTarget = data.placas || vehiculo.placas;
      fotoUrl = await this.uploadImageToStorage(file, placasTarget);
    }

    const cleanData = this.sanitizeDataForPrisma(data, fotoUrl);
    return this.prisma.vehiculos.update({ where: { id }, data: cleanData });
  }

  async remove(id: string) {
    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    // Purga física de la foto al eliminar el registro
    if (vehiculo.foto_unidad_url) {
      await this.deleteImageFromStorage(vehiculo.foto_unidad_url);
    }

    return this.prisma.vehiculos.delete({ where: { id } });
  }
}
