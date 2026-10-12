import { Injectable, BadRequestException } from '@nestjs/common';
import { ARServiceHandler } from './ar-service.interface';


@Injectable()
export class StudentCornerService implements ARServiceHandler {

  async processEvent(payload: any, instanceData: any) {
    const { action, itemId } = payload;
    const items = instanceData?.content?.items || [];

    if (action === 'view_item') {
      const item = items.find((i: any) => i.id === itemId);
      if (!item) {
        throw new BadRequestException('Item not found in Student Corner.');
      }
      return { status: 'success', data: item };
    }

    if (action === 'get_all') {
      return { status: 'success', data: items };
    }

    throw new BadRequestException(`Action '${action}' not supported for Student Corner Service.`);
  }

  getSchema() {
    return {
      title: 'Student Corner',
      configurationFields: [
        { name: 'title', type: 'string', required: true, default: 'Student Corner' },
        { name: 'allowedCategories', type: 'array_string', default: ['Achievements', 'Projects', 'Arts', 'Events'] }
      ],
      contentSchema: {
        type: 'array',
        name: 'items',
        items: {
          id: { type: 'uuid' },
          title: { type: 'string', required: true },
          description: { type: 'text', required: true },
          category: { type: 'string', required: true },
          date: { type: 'date' },
          image: { type: 'url' },
          video: { type: 'url' }
        }
      }
    };
  }
}
