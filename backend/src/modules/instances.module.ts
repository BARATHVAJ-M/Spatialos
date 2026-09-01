import { Module } from '@nestjs/common';
import { InstancesController } from '../api/instances.controller';
import { InstancesService } from '../ar_services/instances.service';
import { PrismaModule } from '../database/prisma.module';
import { StaffModule } from './staff.module';
import { NoticeBoardService } from '../ar_services/notice-board.service';
import { ComplaintBoxService } from '../ar_services/complaint-box.service';
import { EntranceService } from '../ar_services/entrance.service';
import { StaffDetailsService } from '../ar_services/staff-details.service';
import { HodCabinService } from '../ar_services/hod-cabin.service';
import { CoffeeMenuService } from '../ar_services/coffee-menu.service';
import { ClassroomService } from '../ar_services/classroom.service';
import { StudentCornerService } from '../ar_services/student-corner.service';

@Module({
  imports: [PrismaModule, StaffModule],
  controllers: [InstancesController],
  providers: [
    InstancesService,
    NoticeBoardService,
    ComplaintBoxService,
    EntranceService,
    StaffDetailsService,
    HodCabinService,
    CoffeeMenuService,
    ClassroomService,
    StudentCornerService
  ]
})
export class InstancesModule {}
