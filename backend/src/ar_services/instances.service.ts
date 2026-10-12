import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { AR_SERVICE_REGISTRY } from './service-registry';
import { ARServiceHandler } from './ar-service.interface';

@Injectable()
export class InstancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef
  ) {}

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

  async executeAction(id: string, payload: any) {
    const instance = await this.findOne(id);
    const serviceDefEntry = Object.values(AR_SERVICE_REGISTRY).find(
      (def) => def.name === instance.serviceDefinition.name
    );
    
    if (!serviceDefEntry || !serviceDefEntry.handler) {
      throw new BadRequestException(`Action handler not found for service: ${instance.serviceDefinition.name}`);
    }

    try {
      const handler = this.moduleRef.get(serviceDefEntry.handler, { strict: false }) as ARServiceHandler;
      if (handler && typeof handler.processEvent === 'function') {
        return await handler.processEvent(payload, instance, instance.organizationId);
      } else {
        throw new BadRequestException('Handler does not support processEvent');
      }
    } catch (error: any) {
      throw new BadRequestException(`Failed to execute action: ${error.message}`);
    }
  }
}
