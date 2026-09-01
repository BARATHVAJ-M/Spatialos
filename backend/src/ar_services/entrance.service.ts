import { Injectable, BadRequestException } from '@nestjs/common';
import { StaffRepository } from '../database/repositories/staff.repository';

@Injectable()
export class EntranceService {
  constructor(private readonly staffRepository: StaffRepository) {}

  /**
   * Processes runtime interactions. The AR App can request detailed staff info 
   * by passing a staffId configured in the entrance template.
   */
  async processEvent(payload: any, instanceData: any, organizationId: string) {
    const { action, staffId } = payload;

    if (action === 'view_staff') {
      // Validate the staff member is actually part of this department's configuration
      const allowedStaffIds = instanceData?.configuration?.staffIds || [];
      if (!allowedStaffIds.includes(staffId)) {
        throw new BadRequestException('Staff member not associated with this department entrance.');
      }

      // Query the Central Shared Staff Directory
      const staffDetails = await this.staffRepository.findByStaffId(organizationId, staffId);
      if (!staffDetails) {
         throw new BadRequestException('Staff details not found in directory.');
      }

      return { status: 'success', data: staffDetails };
    }

    if (action === 'view_achievement') {
       const achievements = instanceData?.content?.achievements || [];
       const match = achievements.find((a: any) => a.id === payload.achievementId);
       return { status: 'success', data: match };
    }

    return { status: 'success', message: 'Action not supported' };
  }

  getSchema() {
    return {
      title: 'Department Entrance',
      configurationFields: [
        { name: 'departmentName', type: 'string', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'mainImage', type: 'url' },
        { name: 'mainVideo', type: 'url' },
        { name: 'message', type: 'string' },
        { name: 'enableAchievements', type: 'boolean', default: true },
        { name: 'enableStaff', type: 'boolean', default: true },
        { name: 'enableAcademicBest', type: 'boolean', default: true },
        { name: 'staffIds', type: 'array_string', description: 'Array of Staff IDs to display' }
      ],
      contentSchema: {
        achievements: { type: 'array', items: { id: 'uuid', title: 'string', description: 'text', image: 'url' } },
        academicBest: { type: 'array', items: { id: 'uuid', title: 'string', details: 'text' } }
      }
    };
  }
}
