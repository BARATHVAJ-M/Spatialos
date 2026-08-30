import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OverviewModule } from './overview/overview.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { ContentModule } from './content/content.module';
import { ComponentsModule } from './components/components.module';
import { PlacesModule } from './places/places.module';
import { ServicesModule } from './services/services.module';
import { ActionsModule } from './actions/actions.module';
import { CompilerModule } from './compiler/compiler.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HealthController } from './common/controllers/health.controller';
import { SeedService } from './common/seed.service';

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
    CompilerModule
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
