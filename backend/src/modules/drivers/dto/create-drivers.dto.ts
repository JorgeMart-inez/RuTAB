import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  licencia?: string;

  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

  @IsOptional() // Lo hacemos opcional aquí para que el Patch no chille, la lógica de "obligatorio en create" la manejamos en el servicio
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  foto_perfil_url?: string;
}
