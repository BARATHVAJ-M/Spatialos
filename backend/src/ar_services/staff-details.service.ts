import { Injectable, BadRequestException } from '@nestjs/common';
import { StaffRepository } from '../database/repositories/staff.repository';

@Injectable()
export class StaffDetailsService {
  constructor(private readonly staffRepository: StaffRepository) {}

  /**
   * The Staff Details service doesn't store its own staff data. 
   * It relies entirely on the configuration pointing to a Staff ID.
   */
  async processEvent(payload: any, instanceData: any, organizationId: string) {
    const { action } = payload;
    const staffId = instanceData?.configuration?.staffId;

    if (!staffId) {
        throw new BadRequestException('This service is not configured with a Staff ID.');
    }

    if (action === 'fetch_profile') {
      const staffDetails = await this.staffRepository.findByStaffId(organizationId, staffId);
      if (!staffDetails) {
         throw new BadRequestException('Staff details not found in directory.');
      }
      return { status: 'success', data: staffDetails };
    }

    return { status: 'success', message: 'Action not supported' };
  }

  getSchema() {
    return {
      title: 'Staff Details',
      configurationFields: [
        { name: 'staffId', type: 'string', required: true, description: 'Select from Staff Directory' },
        { name: 'displayTimetable', type: 'boolean', default: true },
        { name: 'displayContact', type: 'boolean', default: true }
      ],
      contentSchema: {} // Purely reference-based, no custom content
    };
  }
}
