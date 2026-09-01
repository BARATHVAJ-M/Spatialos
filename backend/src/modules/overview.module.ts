import { Module } from '@nestjs/common';
import { OverviewController } from '../api/overview.controller';

@Module({
  controllers: [OverviewController],
})
export class OverviewModule {}
