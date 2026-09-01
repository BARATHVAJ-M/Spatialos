import { Controller, Get, Post, Put, Delete, UseGuards, Req, Body, Param, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PrismaService } from '../database/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/overview')
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async getSummary(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const [placesCount, expCount, svcCount, contentCount, usersCount] = await Promise.all([
      this.prisma.place.count({ where: { organizationId: orgId } }),
      this.prisma.experience.count({ where: { organizationId: orgId } }),
      this.prisma.serviceInstance.count({ where: { organizationId: orgId } }),
      this.prisma.contentAsset.count({ where: { organizationId: orgId } }),
      this.prisma.user.count({ where: { organizationId: orgId } })
    ]);

    return [
      { label: 'Active Places', value: placesCount.toString(), total: placesCount.toString(), icon: 'MapPin', href: '/places', color: 'bg-blue-500' },
      { label: 'Experiences', value: expCount.toString(), total: expCount.toString(), icon: 'Box', href: '/experiences', color: 'bg-purple-500' },
      { label: 'Active Services', value: svcCount.toString(), total: svcCount.toString(), icon: 'Server', href: '/services', color: 'bg-emerald-500' },
      { label: 'Total Content', value: contentCount.toString(), icon: 'ImageIcon', href: '/content', color: 'bg-amber-500' },
      { label: 'Total Users', value: usersCount.toString(), icon: 'Users', href: '/users', color: 'bg-indigo-500' }
    ];
  }

  @Get('publishing')
  async getPublishing(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    
    const [drafts, published, archived] = await Promise.all([
      this.prisma.experience.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      this.prisma.experience.count({ where: { organizationId: orgId, status: 'PUBLISHED' } }),
      this.prisma.experience.count({ where: { organizationId: orgId, status: 'ARCHIVED' } })
    ]);

    return [
      { label: 'Draft', count: drafts, icon: 'FileText', color: 'text-slate-500' },
      { label: 'Published', count: published, icon: 'CheckCircle2', color: 'text-emerald-500' },
      { label: 'Archived', count: archived, icon: 'Archive', color: 'text-red-500' },
    ];
  }

  @Get('health')
  async getHealth() {
    // Ping DB
    let dbStatus = 'Offline';
    let dbColor = 'text-red-500';
    let dbBg = 'bg-red-50';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'Healthy';
      dbColor = 'text-emerald-500';
      dbBg = 'bg-emerald-50';
    } catch (e) {
      console.error('DB Health Check Failed:', e);
    }

    return [
      { label: 'Backend API', icon: 'Network', status: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Database', icon: 'Database', status: dbStatus, color: dbColor, bg: dbBg },
      { label: 'Asset Storage', icon: 'HardDrive', status: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'AR Engine', icon: 'Glasses', status: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50' }
    ];
  }

  @Get('activity')
  async getActivity(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const logs = await this.prisma.authAuditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    return logs.map(log => ({
      id: log.id,
      action: log.status,
      entity: log.email || 'Unknown User',
      time: log.timestamp.toISOString(),
      type: log.status === 'SUCCESS' ? 'publish' : 'error'
    }));
  }

  @Get('users')
  async getUsers(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId }
    });

    return users.map(u => {
      let status = 'Active';
      if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
        status = 'Locked';
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: status,
        activity: 'Active'
      };
    });
  }

  @Post('users')
  async createUser(@Req() req, @Body() body: any) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const { name, email, password, role } = body;
    
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        organizationId: orgId,
        name,
        email,
        passwordHash,
        role: role || 'VIEWER'
      }
    });
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    const { name, role, status } = body;
    const data: any = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (status === 'Active') {
      data.lockedUntil = null;
      data.loginAttempts = 0;
    }

    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  @Get('publishing/queue')
  async getPublishingQueue(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const drafts = await this.prisma.experience.findMany({
      where: { organizationId: orgId, status: 'DRAFT' },
      include: { place: true },
      orderBy: { version: 'desc' }
    });
    
    return drafts.map(d => ({
      id: d.id,
      entity: d.name,
      type: 'Experience',
      place: d.place?.name || 'Unknown',
      version: `v${d.version}.0.0`,
      status: 'Ready',
      updated: 'Recently',
      by: 'System Admin'
    }));
  }

  @Get('publishing/history')
  async getPublishingHistory(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    const history = await this.prisma.experience.findMany({
      where: { 
        organizationId: orgId, 
        status: { in: ['PUBLISHED', 'ARCHIVED'] } 
      },
      include: { place: true },
      orderBy: { version: 'desc' }
    });
    
    return history.map(h => ({
      id: h.id,
      entity: h.name,
      type: 'Experience',
      place: h.place?.name || 'Unknown',
      version: `v${h.version}.0.0`,
      status: h.status, // 'PUBLISHED' or 'ARCHIVED'
      updated: 'Recently',
      by: 'System Admin'
    }));
  }

  @Get('monitoring/logs')
  async getMonitoringLogs(@Req() req) {
    const logs = await this.prisma.authAuditLog.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' }
    });

    return logs.map(l => ({
      id: l.id,
      severity: l.status === 'FAILED' || l.status === 'LOCKED' ? 'Error' : 'Info',
      time: l.timestamp.toISOString(),
      message: `User login ${l.status.toLowerCase()} from ${l.ipAddress || 'unknown IP'}`,
      source: 'AuthModule',
      entity: l.email || 'System'
    }));
  }
}
