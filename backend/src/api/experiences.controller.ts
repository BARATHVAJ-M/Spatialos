import { Controller, Post, Body, Param, Put, Req, Get, Delete, UseGuards } from '@nestjs/common';
import { ExperiencesService } from '../logic/experiences.service';
import { CreateExperienceDto, UpdateSpatialNodesDto } from '../experiences/dto/experience.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  findAll(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.findOne(orgId, id);
  }

  @Post()
  create(@Body() createExperienceDto: CreateExperienceDto, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.create(orgId, createExperienceDto.placeId, createExperienceDto.name);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.update(orgId, id, updateDto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.publish(orgId, id);
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.rollback(orgId, id);
  }

  @Put(':id/nodes')
  updateNodes(@Param('id') id: string, @Body() body: any, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.updateNodes(orgId, id, body.nodes);
  }

  @Put(':id/services')
  updateServices(@Param('id') id: string, @Body() body: any, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.updateServiceInstances(orgId, id, body.instances);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.remove(orgId, id);
  }
}

