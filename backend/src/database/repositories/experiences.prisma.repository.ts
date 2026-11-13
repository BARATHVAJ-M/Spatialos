import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IExperiencesRepository } from '../../core/contracts/experiences-repository.contract';
import { AppError } from '../../core/errors/app-error';

@Injectable()
export class ExperiencesPrismaRepository implements IExperiencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<any[]> {
    try {
      return await this.prisma.experience.findMany({
        where: { organizationId },
        include: {
          place: {
            select: { name: true },
          },
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_FIND_ALL_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async findById(organizationId: string, id: string): Promise<any | null> {
    try {
      return await this.prisma.experience.findFirst({
        where: { id, organizationId },
        include: {
          place: { select: { name: true, id: true } },
          spatialNodes: true,
          serviceInstances: {
            include: {
              serviceDefinition: {
                select: { name: true, version: true, configurationSchema: true },
              },
            },
          },
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_FIND_BY_ID_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async findByIdBasic(organizationId: string, id: string): Promise<any | null> {
    try {
      return await this.prisma.experience.findFirst({
        where: { id, organizationId },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_FIND_BY_ID_BASIC_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async create(data: { organizationId: string; placeId: string; name: string }): Promise<any> {
    try {
      return await this.prisma.experience.create({
        data: {
          organizationId: data.organizationId,
          placeId: data.placeId,
          name: data.name,
          status: 'DRAFT',
          version: 1,
        },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CREATE_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async update(id: string, data: { name?: string; description?: string; targetPlaceId?: string; status?: string; version?: number }): Promise<any> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.targetPlaceId !== undefined) updateData.placeId = data.targetPlaceId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.version !== undefined) updateData.version = data.version;

      return await this.prisma.experience.update({
        where: { id },
        data: updateData,
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_UPDATE_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async publish(organizationId: string, id: string, placeId: string, newVersion: number): Promise<any> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const publishedExp = await prisma.experience.findFirst({
          where: { placeId, status: 'PUBLISHED' },
        });

        if (publishedExp) {
          const maxExp = await prisma.experience.findFirst({
            where: { placeId },
            orderBy: { version: 'desc' },
          });
          const nextVersion = (maxExp?.version || 0) + 1;

          await prisma.experience.update({
            where: { id: publishedExp.id },
            data: { status: 'ARCHIVED', version: nextVersion },
          });
        }

        return await prisma.experience.update({
          where: { id },
          data: { status: 'PUBLISHED' },
        });
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_PUBLISH_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async rollback(organizationId: string, placeId: string, targetVersion: number): Promise<any> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const publishedExp = await prisma.experience.findFirst({
          where: { placeId, status: 'PUBLISHED' },
        });

        if (publishedExp) {
          const maxExp = await prisma.experience.findFirst({
            where: { placeId },
            orderBy: { version: 'desc' },
          });
          const nextVersion = (maxExp?.version || 0) + 1;

          await prisma.experience.update({
            where: { id: publishedExp.id },
            data: { status: 'ARCHIVED', version: nextVersion },
          });
        }

        // Restore target experience to published
        return await prisma.experience.updateMany({
          where: { placeId, version: targetVersion },
          data: { status: 'PUBLISHED' },
        });
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_ROLLBACK_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async replaceSpatialNodes(experienceId: string, nodes: any[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.spatialNode.deleteMany({
          where: { experienceId },
        });

        if (nodes && nodes.length > 0) {
          await prisma.spatialNode.createMany({
            data: nodes.map((node) => {
              let nType = 'UI_PANEL';
              if (node.type === '3D Model' || node.type === 'Video Plane' || node.type === 'Audio Zone') {
                nType = 'MEDIA';
              }
              const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
              const refId = node.boundEntityId && isUuid(node.boundEntityId)
                ? node.boundEntityId
                : (node.referenceId && isUuid(node.referenceId) ? node.referenceId : null);

              return {
                id: node.id,
                experienceId,
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
            }),
          });
        }
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_REPLACE_SPATIAL_NODES_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async replaceServiceInstances(experienceId: string, instances: any[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const providedIds = instances.map((i) => i.id).filter(Boolean);
        const instancesToDelete = await prisma.serviceInstance.findMany({
          where: {
            experienceId,
            ...(providedIds.length > 0 ? { id: { notIn: providedIds } } : {}),
          },
        });

        const nodeIdsToDelete = instancesToDelete.map((i) => i.spatialNodeId).filter(Boolean);

        if (instancesToDelete.length > 0) {
          await prisma.serviceInstance.deleteMany({
            where: { id: { in: instancesToDelete.map((i) => i.id) } },
          });
        }

        if (nodeIdsToDelete.length > 0) {
          await prisma.spatialNode.deleteMany({
            where: { id: { in: nodeIdsToDelete as string[] } },
          });
        }

        for (const inst of instances) {
          if (inst.id && inst.id.length > 10) {
            await prisma.serviceInstance.upsert({
              where: { id: inst.id },
              create: {
                id: inst.id,
                organizationId: inst.organizationId || '00000000-0000-0000-0000-000000000000',
                experienceId,
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
              },
            });
          }
        }
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_REPLACE_SERVICE_INSTANCES_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.experience.delete({
        where: { id },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_DELETE_FAILED', e.message, 'experiences.prisma.repository.ts');
    }
  }
}
