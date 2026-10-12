import { Injectable, BadRequestException } from '@nestjs/common';
import { ARServiceHandler } from './ar-service.interface';

@Injectable()
export class ClassroomService implements ARServiceHandler {

  async processEvent(payload: any, instanceData: any) {
    const { action } = payload;
    const reminders = instanceData?.content?.reminders || [];
    const config = instanceData?.configuration || {};

    if (action === 'get_current_status') {
      const now = new Date();
      
      const currentClass = config.currentClass && config.currentClass.subject 
        ? config.currentClass 
        : null;
        
      const nextClass = config.nextClass && config.nextClass.subject 
        ? config.nextClass 
        : null;

      // Filter active reminders
      const activeReminders = reminders.filter((r: any) => {
         if (!r.active) return false;
         if (r.expirationDate && new Date(r.expirationDate) < now) return false;
         return true;
      });

      return {
         status: 'success',
         data: {
             currentClass,
             nextClass,
             reminders: activeReminders
         }
      };
    }

    if (action === 'view_timetable') {
       throw new BadRequestException(`Timetable viewing is no longer supported for Classroom Service.`);
    }

    throw new BadRequestException(`Action '${action}' not supported for Classroom Service.`);
  }

  getSchema() {
    return {
      title: 'Classroom',
      configurationFields: [
        { name: 'className', type: 'string', required: true, description: 'e.g., III IT A' },
        { name: 'displayOptions', type: 'json', default: { showReminders: true, showNextClass: true } },
        { name: 'currentClass', type: 'json', default: { subject: '', time: '', staff: '' } },
        { name: 'nextClass', type: 'json', default: { subject: '', time: '', staff: '' } }
      ],
      contentSchema: {
        reminders: {
          type: 'array',
          items: { id: 'uuid', title: 'string', description: 'text', active: 'boolean', expirationDate: 'date' }
        }
      }
    };
  }
}
