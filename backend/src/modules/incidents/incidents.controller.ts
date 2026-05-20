import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { GetIncidentsDto } from './dto/get-incidents.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Roles('superAdmin', 'auditor', 'logístico') 
  @Get()
  async findAll(@Query() query: GetIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Roles('superAdmin', 'auditor', 'logístico')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateIncidentStatusDto,
  ) {
    return this.incidentsService.updateStatus(id, updateDto.estado);
  }
}
