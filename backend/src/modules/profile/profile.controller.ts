import {
  Controller,
  Patch,
  Post,
  Body,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Actualizar datos personales y/o contraseña
   */
  @Patch('update')
  update(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    // req.user.userId viene del JwtStrategy (basado en el 'sub' del token)
    return this.profileService.update(req.user.userId, updateProfileDto);
  }

  /**
   * Subir o cambiar foto de perfil
   * Limitamos a 2MB y formatos de imagen comunes
   */
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(req.user.userId, file);
  }
}
