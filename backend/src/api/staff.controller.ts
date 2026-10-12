import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { StaffSyncService } from '../logic/staff-sync.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/staff')
export class StaffController {
  constructor(
    private readonly staffSyncService: StaffSyncService
  ) {}

  @Get()
  getStaffDirectory(@Req() req) {
    const organizationId = req.user?.orgId || req.user?.organizationId || '123e4567-e89b-12d3-a456-426614174000';
    return this.staffSyncService.getAllStaff(organizationId);
  }

  @Post('sync')
  async syncFromSheet(@Req() req) {
    const organizationId = req.user?.orgId || req.user?.organizationId || '123e4567-e89b-12d3-a456-426614174000';
    // Use the IT Staff Details CSV Export link based on the provided sheet ID
    const IT_STAFF_DETAILS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1O7K5XS_z3rxaKVP_REQQly2fwo8mB6wcGYy15Dp8_V0/export?format=csv';
    
    // Execute synchronously to avoid BullMQ Mock hang and return the exact counts to the dashboard
    return this.staffSyncService.syncFromGoogleSheet(organizationId, IT_STAFF_DETAILS_CSV_URL);
  }
}
