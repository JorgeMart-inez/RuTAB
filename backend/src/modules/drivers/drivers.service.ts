import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateDriverDto } from './dto/create-drivers.dto';
import * as bcrypt from 'bcrypt'; // instalar bcrypt con npm install bcrypt && npm install -D @types/bcrypt

const DRIVER_SELECT = {
  id: true,
  nombre: true,
  licencia: true,
  correo: true,
  telefono: true,
  foto_perfil_url: true,
};

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    const { correo, password, ...rest } = createDriverDto;

    const correoExistente = await this.prisma.choferes.findUnique({
      where: { correo },
    });

    if (correoExistente) {
      throw new ConflictException('Este correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return this.prisma.choferes.create({
      data: {
        ...rest,
        correo,
        password: hashedPassword,
      },
      select: DRIVER_SELECT,
    });
  }

  async findAll() {
    return this.prisma.choferes.findMany({ select: DRIVER_SELECT });
  }

  async findOne(id: string) {
    const driver = await this.prisma.choferes.findUnique({
      where: { id },
      select: DRIVER_SELECT,
    });
    if (!driver) throw new NotFoundException('Chofer no encontrado.');

    return driver;
  }

  async update(id: string, data: Partial<CreateDriverDto>) {
    const existe = await this.prisma.choferes.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Chofer no encontrado.');

    if (data.correo && data.correo !== existe.correo) {
      const correoExistente = await this.prisma.choferes.findUnique({
        where: { correo: data.correo },
      });
      if (correoExistente) {
        throw new ConflictException('Este correo electrónico ya está registrado');
      }
    }

    const updateData: Partial<CreateDriverDto> = { ...data };

    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    return this.prisma.choferes.update({
      where: { id },
      data: updateData,
      select: DRIVER_SELECT,
    });
  }

  async remove(id: string) {
    const driver = await this.prisma.choferes.findUnique({ where: {id}});
    if(!driver) throw new NotFoundException('Chofer no encontrado.');

    return this.prisma.choferes.delete({ where: { id }});
  }
}