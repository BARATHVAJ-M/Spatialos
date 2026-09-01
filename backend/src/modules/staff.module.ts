import { Module } from '@nestjs/common';
import { StaffController } from '../api/staff.controller';
import { StaffService } from '../logic/staff.service';
import { StaffRepository } from '../database/repositories/staff.repository';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository],
  exports: [StaffService, StaffRepository]
})
export class StaffModule {}
