// backend/src/modules/vehicles/vehicles.controller.ts

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
   * Registra un nuevo vehículo incluyendo el archivo binario de la foto.
   */
  @Post()
  @Roles('superAdmin', 'logístico')
  @UseInterceptors(FileInterceptor('foto_unidad'))
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vehiclesService.create(createVehicleDto, file);
  }

  /**
   * Obtiene la lista completa de vehículos.
   */
  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  /**
   * Obtiene la información detallada de un vehículo por su ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * Actualiza los datos de un vehículo y maneja la sustitución opcional de su imagen.
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

  /**
   * Remueve de forma lógica o física un vehículo según su ID.
   */
  @Delete(':id')
  @Roles('superAdmin')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
