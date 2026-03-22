import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { CreateCustomerDto } from './dto/create-customers.dto'

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateCustomerDto) {
        const existe = await this.prisma.clientes.findUnique({ where: {correo: data.correo} });
        if (existe) throw new ConflictException('El correo electrónico ingresado ya está ingresado.');

        return this.prisma.clientes.create({ data });
    }

    async findAll(){
        return this.prisma.clientes.findMany();
    }

    async findOne(id: string) {
        const customer = await this.prisma.clientes.findUnique({where: {id}});
        if (!customer) throw new NotFoundException('Cliente no encontrado.');

        return customer;
    }

    async update(id: string, data: Partial<CreateCustomerDto>) {
        const existe = await this.prisma.clientes.findUnique({ where: { id } });
        if (!existe) throw new NotFoundException('Cliente no encontrado.');

        return this.prisma.clientes.update({
            where: {id},
            data,
        });
    }

    async remove(id: string) {
        const customer = await this.prisma.clientes.findUnique({where: {id} });
        if (!customer) throw new NotFoundException('Cliente no encontrado.');

        return this.prisma.clientes.delete({where: {id} });
    }
}