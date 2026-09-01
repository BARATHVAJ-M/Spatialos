import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth.module';
import { OverviewModule } from './modules/overview.module';
import { ExperiencesModule } from './modules/experiences.module';
import { ContentModule } from './modules/content.module';
import { ComponentsModule } from './modules/components.module';
import { PlacesModule } from './modules/places.module';
import { ServicesModule } from './modules/services.module';
import { ActionsModule } from './modules/actions.module';
import { CompilerModule } from './modules/compiler.module';
import { StaffModule } from './modules/staff.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HealthController } from './api/health.controller';
import { SeedService } from './logic/seed.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    OverviewModule,
    ExperiencesModule,
    ContentModule,
    ComponentsModule,
    PlacesModule,
    ServicesModule,
    ActionsModule,
    CompilerModule,
    StaffModule
  ],
  controllers: [HealthController],
  providers: [
    SeedService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    }
  ],
})
export class AppModule {}
