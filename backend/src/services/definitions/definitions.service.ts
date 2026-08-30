import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.serviceDefinition.findMany({
      where: { organizationId },
      include: {
        actions: true,
      },
    });
  }

  async findOne(id: string) {
    const def = await this.prisma.serviceDefinition.findUnique({
      where: { id },
      include: {
        actions: true,
      },
    });
    if (!def) {
      throw new NotFoundException(`Service definition ${id} not found`);
    }
    return def;
  }

  async create(organizationId: string, data: any) {
    return this.prisma.serviceDefinition.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.serviceDefinition.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.serviceDefinition.delete({
      where: { id },
    });
  }
}
