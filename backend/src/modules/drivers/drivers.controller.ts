import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-drivers.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @Roles('superAdmin', 'logístico')
  create(@Body() CreateDriverDto: CreateDriverDto) {
    return this.driversService.create(CreateDriverDto);
  }

  @Get()
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @Roles('superAdmin', 'logístico')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateDriverDto>) {
    return this.driversService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superAdmin')
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  @Post('upload-avatar')
  @Roles('superAdmin', 'logístico')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.driversService.uploadAvatar(file);
  }
}
