import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { redisStore } from 'cache-manager-redis-yet';
import RedisMock from 'ioredis-mock';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth.module';
import { OverviewModule } from './modules/overview.module';
import { ExperiencesModule } from './modules/experiences.module';
import { ContentModule } from './modules/content.module';
import { PlacesModule } from './modules/places.module';
import { ServicesModule } from './modules/services.module';
import { ActionsModule } from './modules/actions.module';
import { CompilerModule } from './modules/compiler.module';
import { StaffModule } from './modules/staff.module';
import { SettingsModule } from './modules/settings.module';
import { EmailModule } from './modules/email.module';
import { JobsModule } from './modules/jobs.module';
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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const useRedis = process.env.REDIS_URL != null;
        if (useRedis) {
          return {
            store: await redisStore({ url: process.env.REDIS_URL }),
            ttl: 60000,
          };
        }
        // Fallback to In-Memory for local development
        return {
          ttl: 60000,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: process.env.REDIS_URL 
        ? { url: process.env.REDIS_URL } 
        : new RedisMock() as any, // Use in-memory mock when no Redis server is available
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    OverviewModule,
    ExperiencesModule,
    ContentModule,
    PlacesModule,
    ServicesModule,
    ActionsModule,
    CompilerModule,
    StaffModule,
    SettingsModule,
    EmailModule,
    JobsModule
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
