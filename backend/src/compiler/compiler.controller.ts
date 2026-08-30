import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CompilerService } from './compiler.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('v1')
export class CompilerController {
  constructor(private readonly compilerService: CompilerService) {}

  @Get('scene')
  async getScene(@Query('qr_id') qrId: string) {
    if (!qrId) {
      return { error: 'qr_id is required' };
    }
    return this.compilerService.compileSceneForClient(qrId);
  }
}

