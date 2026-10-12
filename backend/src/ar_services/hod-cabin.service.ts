import { Injectable, BadRequestException } from '@nestjs/common';
import { StaffRepository } from '../database/repositories/staff.repository';
import { ARServiceHandler } from './ar-service.interface';


@Injectable()
export class HodCabinService implements ARServiceHandler {
  constructor(private readonly staffRepository: StaffRepository) {}

  async processEvent(payload: any, instanceData: any, organizationId: string) {
    const { action } = payload;
    const hodStaffId = instanceData?.configuration?.hodStaffId;

    if (action === 'fetch_hod_profile') {
      if (!hodStaffId) {
        throw new BadRequestException('HOD Staff ID not configured.');
      }
      
      const staffDetails = await this.staffRepository.findByStaffId(organizationId, hodStaffId);
      if (!staffDetails) {
         throw new BadRequestException('HOD details not found in directory.');
      }
      return { status: 'success', data: staffDetails };
    }

    if (action === 'view_achievement') {
       const achievements = instanceData?.content?.achievements || [];
       const match = achievements.find((a: any) => a.id === payload.achievementId);
       return { status: 'success', data: match };
    }

    if (action === 'book_appointment') {
      return { status: 'success', action: 'book_appointment', message: 'Appointment request logged (mock)' };
    }

    throw new BadRequestException(`Action '${action}' not supported for HOD Cabin Service.`);
  }

  getSchema() {
    return {
      title: 'HOD Cabin',
      configurationFields: [
        { name: 'hodStaffId', type: 'string', required: true, description: 'Select HOD from Staff Directory' },
        { name: 'departmentDescription', type: 'text', required: true },
        { name: 'mainMessage', type: 'string', required: true }
      ],
      contentSchema: {
        achievements: { type: 'array', items: { id: 'uuid', title: 'string', description: 'text', image: 'url' } }
      }
    };
  }
}
