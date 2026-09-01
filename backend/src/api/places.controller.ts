import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { PlacesService } from '../logic/places.service';
import { CreatePlaceDto, UpdatePlaceDto } from '../places/dto/place.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  findAll(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000'; // Fallback for dev if no guard
    return this.placesService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.placesService.findOne(orgId, id);
  }

  @Post()
  create(@Body() createPlaceDto: CreatePlaceDto, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.placesService.create(orgId, createPlaceDto.name, createPlaceDto.parentId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.placesService.update(orgId, id, updatePlaceDto.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.placesService.remove(orgId, id);
  }
}

