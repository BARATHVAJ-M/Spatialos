import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { StaffService } from '../logic/staff.service';

@Controller('v1/admin/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async getAllStaff(@Request() req: any) {
    // Hardcoded organization for V1 unless JWT extracts it
    const organizationId = req.user?.organizationId || '123e4567-e89b-12d3-a456-426614174000';
    return this.staffService.getStaffDirectory(organizationId);
  }

  @Get(':staffId')
  async getStaffMember(@Param('staffId') staffId: string, @Request() req: any) {
    const organizationId = req.user?.organizationId || '123e4567-e89b-12d3-a456-426614174000';
    return this.staffService.getStaffMember(organizationId, staffId);
  }

  @Post()
  async createStaffMember(@Body() data: any, @Request() req: any) {
    const organizationId = req.user?.organizationId || '123e4567-e89b-12d3-a456-426614174000';
    return this.staffService.createStaffMember(organizationId, data);
  }

  @Put(':id')
  async updateStaffMember(@Param('id') id: string, @Body() data: any) {
    return this.staffService.updateStaffMember(id, data);
  }

  @Delete(':id')
  async deleteStaffMember(@Param('id') id: string) {
    return this.staffService.removeStaffMember(id);
  }
}
