import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class StudentCornerService {

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

    return { status: 'success', message: 'Action not supported' };
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
