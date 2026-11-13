import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IPlacementsService } from '../core/contracts/placements-service.contract';
import { Public } from '../common/decorators/public.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Public()
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 120, ttl: 60000 } })
@Controller('placements')
export class PlacementsController {
  constructor(private readonly placementsService: IPlacementsService) {}

  @Get('preview')
  async preview(@Query('qrCode') qrCode: string) {
    return this.placementsService.preview(qrCode);
  }

  @Get('staff-profile')
  async getStaffProfile(@Query('staffId') staffId: string) {
    return this.placementsService.getStaffProfile(staffId);
  }
}
