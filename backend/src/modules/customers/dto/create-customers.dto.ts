import { IsString, IsNotEmpty, IsOptional, IsNumber, Matches } from 'class-validator';

export class CreateCustomerDto {

  @IsString()
  @IsOptional()
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

   @IsString()
  @IsOptional()
  correo?: string;

  // Coordenadas

  // pedidos

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  estatus?: string;
}