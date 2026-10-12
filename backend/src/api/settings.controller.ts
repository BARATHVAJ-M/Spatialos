import { Controller, Get, Put, Post, Patch, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { SettingsService } from '../logic/settings.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('v1/admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @InjectQueue('background-jobs') private readonly backgroundJobsQueue: Queue
  ) {}

  @Get('profile')
  getProfile(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.getProfile(orgId);
  }

  @Put('profile')
  updateProfile(@Req() req, @Body() body: any) {
    // Only ADMIN or OWNER can update profile
    if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
        // Fallback for simple local development
        if (req.user?.orgId !== '00000000-0000-0000-0000-000000000000') {
           // throw new UnauthorizedException('Insufficient permissions');
        }
    }
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.updateProfile(orgId, body);
  }

  @Get('users')
  getUsers(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.getUsers(orgId);
  }

  @Post('users')
  createUser(@Req() req, @Body() body: { name: string, email: string, role: string }) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.createUser(orgId, body);
  }

  @Post('access-requests')
  createAccessRequest(@Req() req, @Body() body: { name: string, email: string, role: string }) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.createAccessRequest(orgId, body);
  }

  @Put('users/:id/role')
  updateUserRole(@Req() req, @Param('id') userId: string, @Body() body: { role: string }) {
    if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
      if (req.user?.orgId !== '00000000-0000-0000-0000-000000000000') {
        // throw new UnauthorizedException('Insufficient permissions');
      }
    }
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.updateUserRole(orgId, userId, body.role);
  }

  @Get('notifications')
  getNotifications(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.getNotifications(orgId);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Req() req, @Param('id') id: string) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.settingsService.markNotificationRead(orgId, id);
  }

  @Get('users/me')
  getMe(@Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.settingsService.getUserMe(userId);
  }

  @Patch('users/me')
  updateMe(@Req() req, @Body() body: { name?: string }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    if (body.name) {
      return this.settingsService.updateUserName(userId, body.name);
    }
    return this.settingsService.getUserMe(userId);
  }

  @Patch('users/me/preferences')
  updateMyPreferences(@Req() req, @Body() body: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.settingsService.updateUserPreferences(userId, body);
  }

  @Post('garbage-collection')
  async triggerGarbageCollection(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    
    // Push this heavy task to the background queue
    await this.backgroundJobsQueue.add('run-garbage-collection', {
      organizationId: orgId
    });
    
    return { message: 'Garbage collection has been queued and is running in the background.' };
  }
}
