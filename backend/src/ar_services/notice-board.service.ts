import { Injectable, BadRequestException } from '@nestjs/common';
import { ARServiceHandler } from './ar-service.interface';


@Injectable()
export class NoticeBoardService implements ARServiceHandler {
  
  /**
   * Processes runtime interactions from the AR User App
   */
  async processEvent(payload: any, instanceData: any) {
    const { action, noticeId } = payload;

    if (action === 'view_notice') {
      // Find the specific notice from the instance's saved content
      const notices = instanceData?.content?.notices || [];
      const notice = notices.find((n: any) => n.id === noticeId);
      
      if (!notice) {
        throw new BadRequestException('Notice not found.');
      }

      return { status: 'success', data: notice };
    }

    throw new BadRequestException(`Action '${action}' not supported for Notice Board Service.`);
  }

  /**
   * Returns the configuration schema expected by the Dashboard
   */
  getSchema() {
    return {
      title: 'Notice Board',
      configurationFields: [
        { name: 'boardTitle', type: 'string', required: true, default: 'Department Notices' },
        { name: 'themeColor', type: 'color', default: '#0F172A' },
        { name: 'autoArchiveDays', type: 'number', default: 30 }
      ],
      contentSchema: {
        type: 'array',
        name: 'notices',
        items: {
          id: { type: 'uuid' },
          title: { type: 'string', required: true },
          description: { type: 'text', required: true },
          datePosted: { type: 'date', required: true },
          important: { type: 'boolean', default: false },
          mediaUrl: { type: 'url', required: false }
        }
      }
    };
  }
}
