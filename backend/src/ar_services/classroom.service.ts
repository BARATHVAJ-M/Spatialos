import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ClassroomService {

  async processEvent(payload: any, instanceData: any) {
    const { action } = payload;
    const timetable = instanceData?.content?.timetable || [];
    const reminders = instanceData?.content?.reminders || [];

    if (action === 'get_current_status') {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight for easy comparison

      // Filter today's classes
      const todaysClasses = timetable.filter((t: any) => t.day === currentDay);
      
      let currentClass = null;
      let nextClass = null;

      // Simple calculation algorithm
      for (const t of todaysClasses) {
         // Assuming time is stored in "HH:MM" 24h format
         const [hours, mins] = t.time.split(':').map(Number);
         const classStartMins = hours * 60 + mins;
         const classEndMins = classStartMins + 60; // Assuming 1 hr duration for V1

         if (currentTime >= classStartMins && currentTime < classEndMins) {
             currentClass = t;
         } else if (currentTime < classStartMins && !nextClass) {
             nextClass = t;
         }
      }

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
       return { status: 'success', data: timetable };
    }

    return { status: 'success', message: 'Action not supported' };
  }

  getSchema() {
    return {
      title: 'Classroom',
      configurationFields: [
        { name: 'className', type: 'string', required: true, description: 'e.g., III IT A' },
        { name: 'displayOptions', type: 'json', default: { showReminders: true, showNextClass: true } }
      ],
      contentSchema: {
        timetable: { 
          type: 'array', 
          items: { day: 'string', time: 'string', subject: 'string', staff: 'string' } 
        },
        reminders: {
          type: 'array',
          items: { id: 'uuid', title: 'string', description: 'text', active: 'boolean', expirationDate: 'date' }
        }
      }
    };
  }
}
