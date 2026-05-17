import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customers.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { latitude, longitude, ...rest } = createCustomerDto;

    // Verificar si el correo ya existe
    if (rest.correo) {
      const correoExistente = await this.prisma.clientes.findUnique({
        where: { correo: rest.correo },
      });
      if (correoExistente) {
        throw new ConflictException(
          'Este correo electrónico ya está registrado en otro cliente.',
        );
      }
    }

    // Generación de código CLI-XXX
    const ultimoCliente = await this.prisma.clientes.findFirst({
      orderBy: { created_at: 'desc' },
    });

    let siguienteNumero = 1;
    if (ultimoCliente && ultimoCliente.codigo) {
      const partes = ultimoCliente.codigo.split('-');
      if (partes.length === 2) {
        siguienteNumero = parseInt(partes[1], 10) + 1;
      }
    }
    const codigoGenerado = `CLI-${String(siguienteNumero).padStart(3, '0')}`;

    // Inserción manual con SQL Raw para soportar PostGIS (Geography)
    const result = await this.prisma.$queryRaw<any[]>`
      INSERT INTO clientes (
        nombre, telefono, direccion, correo, codigo, contacto, estatus, coordenadas
      ) VALUES (
        ${rest.nombre}, ${rest.telefono}, ${rest.direccion}, ${rest.correo}, 
        ${codigoGenerado}, ${rest.contacto}, ${rest.estatus}, 
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) RETURNING id, nombre, correo, codigo;
    `;

    return result[0];
  }

  async findAll() {
    // Agregamos LEFT JOIN y COUNT para obtener el total de pedidos
    return this.prisma.$queryRaw`
      SELECT 
        c.id, c.nombre, c.telefono, c.direccion, c.correo, c.codigo, c.contacto, c.estatus, c.created_at,
        ST_Y(c.coordenadas::geometry) as latitude, 
        ST_X(c.coordenadas::geometry) as longitude,
        COUNT(p.id)::int as "totalPedidos"
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      GROUP BY c.id
      ORDER BY c.created_at DESC;
    `;
  }

  async findOne(id: string) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        c.id, c.nombre, c.telefono, c.direccion, c.correo, c.codigo, c.contacto, c.estatus, c.created_at,
        ST_Y(c.coordenadas::geometry) as latitude, 
        ST_X(c.coordenadas::geometry) as longitude,
        COUNT(p.id)::int as "totalPedidos"
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE c.id = ${id}::uuid
      GROUP BY c.id;
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException('Cliente no encontrado.');
    }

    return result[0];
  }

  async update(id: string, updateCustomerDto: Partial<CreateCustomerDto>) {
    const clienteActual = await this.prisma.clientes.findUnique({
      where: { id },
    });
    if (!clienteActual) throw new NotFoundException('Cliente no encontrado.');

    const { latitude, longitude, ...rest } = updateCustomerDto;

    // Si viene el correo en el DTO, validamos duplicados (excluyendo al actual)
    if (rest.correo) {
      const duplicado = await this.prisma.clientes.findFirst({
        where: {
          correo: rest.correo,
          NOT: { id },
        },
      });
      if (duplicado)
        throw new ConflictException(
          'Este correo electrónico ya está registrado en otro cliente.',
        );
    }

    // Valores finales

    const nombre =
      rest.nombre !== undefined ? rest.nombre : clienteActual.nombre;
    const telefono =
      rest.telefono !== undefined ? rest.telefono : clienteActual.telefono;
    const direccion =
      rest.direccion !== undefined ? rest.direccion : clienteActual.direccion;
    const correo =
      rest.correo !== undefined ? rest.correo : clienteActual.correo;
    const contacto =
      rest.contacto !== undefined ? rest.contacto : clienteActual.contacto;
    const estatus =
      rest.estatus !== undefined ? rest.estatus : clienteActual.estatus;

    await this.prisma.$executeRaw`
    UPDATE clientes
    SET 
      nombre = ${nombre},
      telefono = ${telefono},
      direccion = ${direccion},
      correo = ${correo}, -- Valor obligatorio
      contacto = ${contacto},
      estatus = ${estatus},
      coordenadas = CASE 
        WHEN ${latitude}::float IS NOT NULL AND ${longitude}::float IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ELSE coordenadas
      END
    WHERE id = ${id}::uuid;
  `;

    return this.findOne(id);
  }

  async remove(id: string) {
    const customer = await this.prisma.clientes.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');

    return this.prisma.clientes.delete({ where: { id } });
  }
}
