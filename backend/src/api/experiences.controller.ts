import { Controller, Post, Body, Param, Put, Req, Get, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
// Removed CacheInterceptor for admin CRUD reliability
import { ExperiencesService } from '../logic/experiences.service';
import { CreateExperienceDto, UpdateExperienceDto, UpdateSpatialNodesDto } from '../experiences/dto/experience.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  create(@Body() createExperienceDto: CreateExperienceDto, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.create(orgId, createExperienceDto.placeId, createExperienceDto.name);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() updateDto: UpdateExperienceDto, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    // Ensure only name and description can be updated via this endpoint
    return this.experiencesService.update(orgId, id, {
      name: updateDto.name,
      description: updateDto.description,
    });
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EDITOR')
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.experiencesService.remove(orgId, id);
  }
}

