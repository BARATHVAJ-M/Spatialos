import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContentService } from './content.service';

@Injectable()
export class ExperiencesService {
  constructor(
    private prisma: PrismaService,
    private contentService: ContentService
  ) {}

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

    if (experience.status === 'PUBLISHED') {
      return experience;
    }

    // Find existing published experience for this place
    const publishedExp = await this.prisma.experience.findFirst({
      where: { placeId: experience.placeId, status: 'PUBLISHED' }
    });

    if (publishedExp) {
      // Find a safe version number for archiving to avoid unique constraint violations
      const maxExp = await this.prisma.experience.findFirst({
        where: { placeId: experience.placeId },
        orderBy: { version: 'desc' }
      });
      const nextVersion = (maxExp?.version || 0) + 1;
      
      await this.prisma.experience.update({
        where: { id: publishedExp.id },
        data: { status: 'ARCHIVED', version: nextVersion }
      });
    }

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

    // Find the currently published experience for this place
    const publishedExp = await this.prisma.experience.findFirst({
      where: { placeId: experience.placeId, status: 'PUBLISHED' }
    });

    if (publishedExp) {
      // Find a safe version number for archiving to avoid unique constraint violations
      const maxExp = await this.prisma.experience.findFirst({
        where: { placeId: experience.placeId },
        orderBy: { version: 'desc' }
      });
      const nextVersion = (maxExp?.version || 0) + 1;
      
      await this.prisma.experience.update({
        where: { id: publishedExp.id },
        data: { status: 'ARCHIVED', version: nextVersion }
      });
    }

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


      // Find instances to delete
      const instancesToDelete = await prisma.serviceInstance.findMany({
        where: {
          experienceId: id,
          ...(providedIds.length > 0 ? { id: { notIn: providedIds } } : {})
        }
      });

      // Extract media URLs from content to clean up orphans
      const mediaUrlsToDelete = new Set<string>();
      
      const mediaRegex = /\/media\/[a-f0-9]{64}/gi;

      const extractMediaUrls = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string') {
          const matches = obj.match(mediaRegex);
          if (matches) {
            matches.forEach(match => mediaUrlsToDelete.add(match));
          }
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(extractMediaUrls);
        }
      };

      for (const instance of instancesToDelete) {
        extractMediaUrls(instance.content);
        extractMediaUrls(instance.configuration);
      }

      // Delete the extracted media assets
      for (const url of mediaUrlsToDelete) {
        try {
          await this.contentService.deleteByUrl(url);
        } catch (e) {
          console.error(`Failed to delete media asset ${url}`, e);
        }
      }

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
    if (data.targetPlaceId !== undefined) updateData.placeId = data.targetPlaceId;
    if (data.status !== undefined) updateData.status = data.status;
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

