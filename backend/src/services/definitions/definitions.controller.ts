import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { DefinitionsService } from './definitions.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/services/definitions')
export class DefinitionsController {
  constructor(private readonly definitionsService: DefinitionsService) {}

  @Post()
  create(@Body() data: any, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.definitionsService.create(orgId, data);
  }

  @Get()
  findAll(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.definitionsService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.definitionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.definitionsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.definitionsService.remove(id);
  }
}
