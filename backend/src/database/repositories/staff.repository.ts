import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StaffRepository {
  constructor(private prisma: PrismaService) {}

  async findAllByOrganization(organizationId: string) {
    return this.prisma.staffDirectory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async findByStaffId(organizationId: string, staffId: string) {
    return this.prisma.staffDirectory.findUnique({
      where: { staffId }
    });
  }

  async create(data: any) {
    return this.prisma.staffDirectory.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.staffDirectory.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.staffDirectory.delete({
      where: { id }
    });
  }
}
