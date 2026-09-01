import { Module } from '@nestjs/common';
import { CompilerService } from '../logic/compiler.service';
import { CompilerController } from '../api/compiler.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompilerController],
  providers: [CompilerService],
})
export class CompilerModule {}
