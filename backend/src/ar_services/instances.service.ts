import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class InstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByNode(spatialNodeId: string) {
    return this.prisma.serviceInstance.findFirst({
      where: { spatialNodeId },
      include: {
        serviceDefinition: true,
      },
    });
  }

  async findOne(id: string) {
    const instance = await this.prisma.serviceInstance.findUnique({
      where: { id },
      include: {
        serviceDefinition: true,
      },
    });
    if (!instance) {
      throw new NotFoundException(`Service instance ${id} not found`);
    }
    return instance;
  }

  async create(spatialNodeId: string, data: any) {
    // Spatial node belongs to an experience, we need to extract experienceId
    const node = await this.prisma.spatialNode.findUnique({
      where: { id: spatialNodeId },
    });

    if (!node) {
      throw new NotFoundException(`Spatial Node ${spatialNodeId} not found`);
    }

    return this.prisma.serviceInstance.create({
      data: {
        ...data,
        spatialNodeId,
        experienceId: node.experienceId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.serviceInstance.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.serviceInstance.delete({
      where: { id },
    });
  }

  async validate(id: string) {
    const instance = await this.findOne(id);
    // Dynamic validation based on configurationSchema and contentSchema
    // For now, we simulate success
    return { valid: true, message: 'Validation successful' };
  }

  async publish(id: string) {
    const validation = await this.validate(id);
    if (!validation.valid) {
      throw new BadRequestException('Cannot publish: Validation failed');
    }

    return this.prisma.serviceInstance.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }
}
