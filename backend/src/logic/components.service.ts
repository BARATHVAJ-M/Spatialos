import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ComponentsService {
  constructor(private prisma: PrismaService) {}

  async createDefinition(organizationId: string, name: string, schema: any) {
    return this.prisma.componentDefinition.create({
      data: {
        organizationId,
        name,
        schema,
      },
    });
  }



  async createTemplate(organizationId: string, componentDefinitionId: string, name: string, uiLayout: any) {
    const definition = await this.prisma.componentDefinition.findUnique({
      where: { id: componentDefinitionId, organizationId }
    });
    if (!definition) throw new NotFoundException('Component definition not found');

    return this.prisma.componentTemplate.create({
      data: {
        componentDefinitionId,
        name,
        uiLayout,
      },
    });
  }
}

