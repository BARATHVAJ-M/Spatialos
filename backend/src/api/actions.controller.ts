import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ActionsService } from '../logic/actions.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1/actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('execute')
  execute(@Body() executeActionDto: { actionId: string; context: any }, @Req() req) {
    // In a real scenario we'd get the user token from req
    return this.actionsService.executeAction(executeActionDto.actionId, executeActionDto.context);
  }
}

