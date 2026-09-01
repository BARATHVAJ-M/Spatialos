import { Injectable, NotFoundException } from '@nestjs/common';
import { StaffRepository } from '../database/repositories/staff.repository';

@Injectable()
export class StaffService {
  constructor(private readonly staffRepository: StaffRepository) {}

  async getStaffDirectory(organizationId: string) {
    return this.staffRepository.findAllByOrganization(organizationId);
  }

  async getStaffMember(organizationId: string, staffId: string) {
    const staff = await this.staffRepository.findByStaffId(organizationId, staffId);
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${staffId} not found`);
    }
    return staff;
  }

  async createStaffMember(organizationId: string, data: any) {
    // Automatically inject organization ID
    const createData = { ...data, organizationId };
    return this.staffRepository.create(createData);
  }

  async updateStaffMember(id: string, data: any) {
    return this.staffRepository.update(id, data);
  }

  async removeStaffMember(id: string) {
    return this.staffRepository.delete(id);
  }
}
