import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Endpoint de Creación con soporte para archivos binarios.
   */
  @Post()
  @Roles('superAdmin', 'logístico')
  @UseInterceptors(FileInterceptor('foto_unidad'))
  create(
    @Body() createVehiculoDto: CreateVehicleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vehiclesService.create(createVehiculoDto, file);
  }

  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * Endpoint de Actualización Parcial con soporte para sustitución de imagen.
   */
  @Patch(':id')
  @Roles('superAdmin', 'logístico')
  @UseInterceptors(FileInterceptor('foto_unidad'))
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateVehicleDto>,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vehiclesService.update(id, updateDto, file);
  }

  @Delete(':id')
  @Roles('superAdmin')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
