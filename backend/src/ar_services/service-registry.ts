/**
 * Central Service Registry for SpatialOS AR Micro-Apps
 * 
 * Register all dynamically loaded AR services here.
 * If you build a new AR app, drop its file in this folder and add it to the registry.
 */

import { NoticeBoardService } from './notice-board.service';
import { CoffeeMenuService } from './coffee-menu.service';
import { ComplaintBoxService } from './complaint-box.service';
import { EntranceService } from './entrance.service';
import { StaffDetailsService } from './staff-details.service';
import { HodCabinService } from './hod-cabin.service';
import { ClassroomService } from './classroom.service';
import { StudentCornerService } from './student-corner.service';

export const AR_SERVICE_REGISTRY = {
  'notice-board': {
    name: 'Notice Board',
    version: '1.2.0',
    description: 'A hovering digital notice board for announcements.',
    handler: NoticeBoardService
  },
  'complaint-box': {
    name: 'Complaint Box',
    version: '1.0.0',
    description: 'A secure, anonymous gateway for student complaints.',
    handler: ComplaintBoxService
  },
  'coffee-menu': {
    name: 'Coffee Menu',
    version: '1.0.0',
    description: 'An interactive AR coffee menu with ordering capabilities.',
    handler: CoffeeMenuService
  },
  'entrance': {
    name: 'Department Entrance',
    version: '1.0.0',
    description: 'Information and achievements for a department entrance.',
    handler: EntranceService
  },
  'staff-details': {
    name: 'Staff Details',
    version: '1.0.0',
    description: 'Profile, contact, and timetable for a staff member.',
    handler: StaffDetailsService
  },
  'hod-cabin': {
    name: 'HOD Cabin',
    version: '1.0.0',
    description: 'HOD profile and department highlights.',
    handler: HodCabinService
  },
  'classroom': {
    name: 'Classroom',
    version: '1.0.0',
    description: 'Timetable parsing and live class reminders.',
    handler: ClassroomService
  },
  'student-corner': {
    name: 'Student Corner',
    version: '1.0.0',
    description: 'Showcase of student achievements and projects.',
    handler: StudentCornerService
  }
};
