import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/spatial-nodes/:spatialNodeId/services')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
  create(@Param('spatialNodeId') spatialNodeId: string, @Body() data: any) {
    return this.instancesService.create(spatialNodeId, data);
  }

  @Get()
  findByNode(@Param('spatialNodeId') spatialNodeId: string) {
    return this.instancesService.findByNode(spatialNodeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instancesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.instancesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instancesService.remove(id);
  }

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.instancesService.validate(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.instancesService.publish(id);
  }
}
