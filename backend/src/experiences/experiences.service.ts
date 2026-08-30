import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.experience.findMany({
      where: { organizationId },
      include: {
        place: {
          select: { name: true }
        }
      }
    });
  }

  async findOne(organizationId: string, id: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId },
      include: {
        place: { select: { name: true, id: true } },
        spatialNodes: true,
        serviceInstances: {
          include: {
            serviceDefinition: {
              select: { name: true, version: true, configurationSchema: true }
            }
          }
        }
      }
    });
    if (!experience) throw new NotFoundException('Experience not found');
    return experience;
  }

  async create(organizationId: string, placeId: string, name: string) {
    return this.prisma.experience.create({
      data: {
        organizationId,
        placeId,
        name,
        status: 'DRAFT',
        version: 1,
      },
    });
  }

  async publish(organizationId: string, id: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId }
    });
    if (!experience) throw new NotFoundException('Experience not found');

    // Archive existing published experience for this place
    await this.prisma.experience.updateMany({
      where: { placeId: experience.placeId, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' }
    });

    // Publish this one
    return this.prisma.experience.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async rollback(organizationId: string, id: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId }
    });
    if (!experience) throw new NotFoundException('Experience not found');

    // Archive the currently published experience for this place
    await this.prisma.experience.updateMany({
      where: { placeId: experience.placeId, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' }
    });

    // Restore this archived one to published
    return this.prisma.experience.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async updateNodes(organizationId: string, id: string, nodes: any[]) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId }
    });
    if (!experience) throw new NotFoundException('Experience not found');

    return this.prisma.$transaction(async (prisma) => {
      await prisma.spatialNode.deleteMany({
        where: { experienceId: id }
      });

      if (nodes && nodes.length > 0) {
        await prisma.spatialNode.createMany({
          data: nodes.map(node => {
            // Map frontend type to backend enum
            let nType = 'UI_PANEL';
            if (node.type === '3D Model' || node.type === 'Video Plane' || node.type === 'Audio Zone') nType = 'MEDIA';
            
            // Map referenceId. It must be a valid UUID.
            const refId = (node.boundEntityId && node.boundEntityId.length > 10) ? node.boundEntityId : node.id;

            return {
              id: node.id,
              experienceId: id,
              nodeType: nType as any,
              referenceId: refId,
              positionX: node.x || 0,
              positionY: node.y || 0,
              positionZ: node.z || 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              scaleX: node.scale || 1,
              scaleY: node.scale || 1,
              scaleZ: node.scale || 1,
            };
          })
        });
      }
      return { success: true };
    });
  }

  async updateServiceInstances(organizationId: string, id: string, instances: any[]) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId }
    });
    if (!experience) throw new NotFoundException('Experience not found');

    return this.prisma.$transaction(async (prisma) => {
      // Find what instances we have
      const providedIds = instances.map(i => i.id).filter(id => id);

      console.log('--- DEBUG DELETE ---');
      console.log('Experience ID:', id);
      console.log('Provided IDs:', providedIds);
      console.log('Instances:', JSON.stringify(instances, null, 2));
      console.log('--------------------');

      // Find instances to delete
      const instancesToDelete = await prisma.serviceInstance.findMany({
        where: {
          experienceId: id,
          ...(providedIds.length > 0 ? { id: { notIn: providedIds } } : {})
        }
      });

      const nodeIdsToDelete = instancesToDelete.map(i => i.spatialNodeId).filter(Boolean);

      // Delete instances
      if (instancesToDelete.length > 0) {
        await prisma.serviceInstance.deleteMany({
          where: { id: { in: instancesToDelete.map(i => i.id) } }
        });
      }

      // Also delete the associated spatial nodes to prevent phantom nodes
      if (nodeIdsToDelete.length > 0) {
        await prisma.spatialNode.deleteMany({
          where: { id: { in: nodeIdsToDelete } }
        });
      }

      // Upsert the rest
      for (const inst of instances) {
        if (inst.id && inst.id.length > 10) {
          await prisma.serviceInstance.upsert({
            where: { id: inst.id },
            create: {
              id: inst.id,
              organizationId,
              experienceId: id,
              spatialNodeId: inst.spatialNodeId,
              serviceDefinitionId: inst.serviceDefinitionId,
              name: inst.name,
              configuration: inst.configuration || {},
              content: inst.content || {},
            },
            update: {
              spatialNodeId: inst.spatialNodeId,
              name: inst.name,
              configuration: inst.configuration || {},
              content: inst.content || {},
            }
          });
        }
      }
      return { success: true };
    });
  }

  async update(orgId: string, id: string, data: any) {
    const exp = await this.findOne(orgId, id);
    if (!exp) throw new NotFoundException('Experience not found');
    
    // Only update allowed fields
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetPlaceId !== undefined) updateData.placeId = data.targetPlaceId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.pubStatus !== undefined) updateData.pubStatus = data.pubStatus;
    if (data.version !== undefined) updateData.version = data.version;

    return this.prisma.experience.updateMany({
      where: {
        id,
        organizationId: orgId
      },
      data: updateData
    });
  }

  async remove(orgId: string, id: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!experience) throw new NotFoundException('Experience not found');

    return this.prisma.experience.delete({
      where: { id },
    });
  }
}

