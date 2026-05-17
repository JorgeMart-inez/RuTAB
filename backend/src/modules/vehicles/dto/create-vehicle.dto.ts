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

  // ─── AGREGA ESTA LÍNEA PARA BLINDAR EL MULTIPART/FORMDATA ───
  /**
   * Permite que el rastro del archivo binario del FormData pase la validación
   * estricta de NestJS sin arrojar "should not exist".
   */
  @IsOptional()
  foto_unidad?: any;
}
