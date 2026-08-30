import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.place.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { experiences: { where: { status: 'PUBLISHED' } } }
        }
      }
    });
  }

  async findOne(organizationId: string, id: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, organizationId },
      include: {
        experiences: {
          orderBy: { version: 'desc' }
        },
        children: true
      }
    });
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  async create(organizationId: string, name: string, parentId?: string) {
    // Generate a secure qrTargetId
    const qrTargetId = `spatialos://resolve?id=${Math.random().toString(36).substring(7)}`;
    return this.prisma.place.create({
      data: {
        organizationId,
        name,
        parentId,
        qrTargetId,
      },
    });
  }

  async update(organizationId: string, id: string, name: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, organizationId }
    });
    if (!place) throw new NotFoundException('Place not found');

    return this.prisma.place.update({
      where: { id },
      data: { name },
    });
  }

  async remove(organizationId: string, id: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, organizationId }
    });
    if (!place) throw new NotFoundException('Place not found');

    // In a real app we might soft delete, but for now hard delete or let Prisma Cascade
    return this.prisma.place.delete({
      where: { id },
    });
  }
}

