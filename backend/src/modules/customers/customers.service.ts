import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { CreateCustomerDto } from './dto/create-customers.dto'

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  // En tu backend: src/customers/customers.service.ts

  async create(createCustomerDto: CreateCustomerDto) {

    // Verificar si el correo ya existe ANTES de intentar guardar
    if (createCustomerDto.correo) {
      const correoExistente = await this.prisma.clientes.findUnique({
        where: { correo: createCustomerDto.correo }
      });

      if (correoExistente) {
        // Esto lanzará un Error 409 que tu frontend entenderá perfectamente
        throw new ConflictException('Este correo electrónico ya está registrado en otro cliente.');
      }
    }

    // Buscamos al último cliente ... (Aquí sigue tu código del CLI-00X)
    const ultimoCliente = await this.prisma.clientes.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // Calculamos el siguiente número
    let siguienteNumero = 1;
    if (ultimoCliente && ultimoCliente.codigo) {
      // Si el último era "CLI-005", lo partimos por el guion, tomamos el "005" y le sumamos 1
      const partes = ultimoCliente.codigo.split('-');
      if (partes.length === 2) {
        siguienteNumero = parseInt(partes[1], 10) + 1;
      }
    }

    // Armamos el nuevo código rellenando con ceros (Ej. 6 -> "CLI-006")
    const codigoGenerado = `CLI-${String(siguienteNumero).padStart(3, '0')}`;

    // Guardamos el cliente inyectando el código autogenerado
    return this.prisma.clientes.create({
      data: {
        ...createCustomerDto,
        codigo: codigoGenerado
      }
    });
  }

  async findAll() {
    return this.prisma.clientes.findMany();
  }

  async findOne(id: string) {
    const customer = await this.prisma.clientes.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');

    return customer;
  }

  async update(id: string, data: Partial<CreateCustomerDto>) {
    const existe = await this.prisma.clientes.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Cliente no encontrado.');

    return this.prisma.clientes.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.clientes.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');

    return this.prisma.clientes.delete({ where: { id } });
  }
}