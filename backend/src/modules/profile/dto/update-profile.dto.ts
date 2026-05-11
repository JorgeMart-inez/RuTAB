import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' }) // Evita ""
  @MinLength(3, { message: 'El nombre es demasiado corto' })
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
