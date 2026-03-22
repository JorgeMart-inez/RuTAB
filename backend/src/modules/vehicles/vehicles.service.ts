import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service'; 
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVehicleDto) {
    const existe = await this.prisma.vehiculos.findUnique({ where: { placas: data.placas } });
    if (existe) throw new ConflictException('Las placas ya están registradas');
    
    return this.prisma.vehiculos.create({ data });
  }

  async findAll() {
    return this.prisma.vehiculos.findMany();
  }

  async findOne(id: string) {
    const vehicle = this.prisma.vehiculos.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('El vehículo no ha sido encontrado.');

    return vehicle;
  }
  
  async update(id: string, data: Partial<CreateVehicleDto>) {
  const existe = await this.prisma.vehiculos.findUnique({ where: { id } });
  if (!existe) throw new NotFoundException('Vehículo no encontrado');
  
  return this.prisma.vehiculos.update({
    where: { id },
    data,
  });
}
  
  async remove(id: string) {
  // Verificamos si existe antes de intentar borrar
  const vehiculo = await this.prisma.vehiculos.findUnique({ where: { id } });
  if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
  
  return this.prisma.vehiculos.delete({ where: { id } });
}
}