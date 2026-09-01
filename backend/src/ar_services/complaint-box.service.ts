import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ComplaintBoxService {
  /**
   * The Complaint Box is a pass-through service for V1.
   * SpatialOS does not store the complaint data to protect privacy.
   * It relies on a configured Google Form URL.
   */
  async processEvent(payload: any, instanceConfiguration: any) {
    if (!instanceConfiguration || !instanceConfiguration.googleFormUrl) {
      throw new BadRequestException('Complaint Box is not properly configured with a Google Form URL.');
    }

    const { action } = payload;
    
    if (action === 'submit_complaint') {
      // In V1, the AR Engine (Flutter) should just open the Google Form URL directly.
      // But if the backend is requested for the link, we provide it here.
      return {
        status: 'success',
        action: 'open_url',
        url: instanceConfiguration.googleFormUrl,
        privacyMessage: instanceConfiguration.privacyMessage || 'Your personal details are not stored in SpatialOS.'
      };
    }

    throw new BadRequestException('Unknown action for Complaint Box Service.');
  }

  /**
   * Returns the configuration schema expected by the Dashboard
   */
  getSchema() {
    return {
      title: 'Complaint Box',
      fields: [
        { name: 'title', type: 'string', required: true, default: 'Complaint Box' },
        { name: 'description', type: 'string', required: true },
        { name: 'privacyMessage', type: 'string', required: true },
        { name: 'googleFormUrl', type: 'url', required: true },
        { name: 'enabled', type: 'boolean', default: true }
      ]
    };
  }
}
