// backend/src/modules/vehicles/vehicles.service.ts

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

  /**
   * Extrae el nombre del archivo a partir de su URL pública.
   */
  private extractFileName(url: string | null): string | null {
    if (!url) return null;
    const parts = url.split('/');
    return parts.pop() || null;
  }

  /**
   * Sube una imagen al almacenamiento de Supabase en formato WebP.
   */
  private async uploadImageToStorage(
    file: Express.Multer.File,
    placas: string,
  ): Promise<string> {
    const fileName = `${placas.toLowerCase()}-${Date.now()}.webp`;

    const { error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(
        `Fallo en Supabase Storage: ${error.message}`,
      );
    }

    const { data: urlData } = this.supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Elimina una imagen existente del almacenamiento de Supabase.
   */
  private async deleteImageFromStorage(imageUrl: string | null): Promise<void> {
    const fileName = this.extractFileName(imageUrl);
    if (!fileName) return;

    await this.supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
  }

  /**
   * Sanitiza y estructura los datos de entrada antes de persistirlos en Prisma.
   */
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

  /**
   * Registra un nuevo vehículo y procesa su imagen si se proporciona.
   */
  async create(data: CreateVehicleDto, file?: Express.Multer.File) {
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

  /**
   * Retorna todos los vehículos registrados.
   */
  async findAll() {
    return this.prisma.vehiculos.findMany();
  }

  /**
   * Retorna un vehículo específico por su ID.
   */
  async findOne(id: string) {
    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    return vehiculo;
  }

  /**
   * Actualiza los datos de un vehículo y reemplaza la imagen anterior si se recibe una nueva.
   */
  async update(
    id: string,
    data: Partial<CreateVehicleDto>,
    file?: Express.Multer.File,
  ) {
    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    let fotoUrl = data.foto_unidad_url;

    if (file) {
      if (vehiculo.foto_unidad_url) {
        await this.deleteImageFromStorage(vehiculo.foto_unidad_url);
      }
      const placasTarget = data.placas || vehiculo.placas;
      fotoUrl = await this.uploadImageToStorage(file, placasTarget);
    }

    const cleanData = this.sanitizeDataForPrisma(data, fotoUrl);
    return this.prisma.vehiculos.update({ where: { id }, data: cleanData });
  }

  /**
   * Elimina de forma física el vehículo y su imagen asociada.
   */
  async remove(id: string) {
    const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    if (vehiculo.foto_unidad_url) {
      await this.deleteImageFromStorage(vehiculo.foto_unidad_url);
    }

    return this.prisma.vehiculos.delete({ where: { id } });
  }
}
