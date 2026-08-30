import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post('definitions/components')
  createDefinition(@Body() dto: { name: string; schema: any }, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.componentsService.createDefinition(orgId, dto.name, dto.schema);
  }

  @Post('components')
  createTemplate(@Body() dto: { componentDefinitionId: string; name: string; uiLayout: any }, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.componentsService.createTemplate(orgId, dto.componentDefinitionId, dto.name, dto.uiLayout);
  }
}

