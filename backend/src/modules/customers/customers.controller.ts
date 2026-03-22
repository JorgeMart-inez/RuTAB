import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customers.dto'
import { Roles } from 'src/common/decorators/roles.decorator'
import { Public } from 'src/common/decorators/public.decorator'
import path from 'path'
import { PartialObserver } from 'rxjs'

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}
  
  @Post()
  @Roles('superAdmin', 'logístico')
  create(@Body() CreateCustomerDto: CreateCustomerDto) {
    return this.customersService.create(CreateCustomerDto);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.customersService.findOne(id);
  }

  @Patch('id:')
  @Roles('superAdmin', 'logístico')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateCustomerDto>) {
    return this.customersService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superAdmin')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}