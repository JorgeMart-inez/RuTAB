// backend/src/modules/vehicles/dto/create-vehicle.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'Las placas son obligatorias' })
  @Matches(/^[A-Z]{3}-[0-9]{3}-[A-Z]{1}$/, {
    message: 'Formato de placa inválido (Ejemplo esperado: ABC-123-A)',
  })
  placas: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber({}, { message: 'El rendimiento debe ser un número válido' })
  @IsOptional()
  rendimiento_combustible?: number;

  @IsString()
  @IsOptional()
  estatus?: string;

  @IsString()
  @IsOptional()
  foto_unidad_url?: string;

  /**
   * Soporte para la carga de archivos binarios mediante multipart/form-data.
   * Evita fallos en la validación estricta de NestJS.
   */
  @IsOptional()
  foto_unidad?: any;
}
