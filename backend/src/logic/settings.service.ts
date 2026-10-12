import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async getProfile(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId }
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateProfile(organizationId: string, data: any) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        supportEmail: data.supportEmail,
        domainContext: data.domainContext,
        settings: data.settings
      }
    });
  }

  async getUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        loginAttempts: true,
        lockedUntil: true
      }
    });
  }

  async updateUserRole(organizationId: string, userId: string, role: string) {
    return this.prisma.user.updateMany({
      where: { id: userId, organizationId },
      data: { role }
    });
  }

  async createUser(organizationId: string, data: { name: string, email: string, role: string }) {
    return this.prisma.user.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: 'TEMPORARY_HASH_TO_BE_SET_BY_INVITE'
      }
    });
  }

  async createAccessRequest(organizationId: string, data: { name: string, email: string, role: string }) {
    const request = await this.prisma.accessRequest.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email,
        role: data.role,
      }
    });

    // Get organization to find support email
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    const supportEmail = org?.supportEmail || 'paanda.group@gmail.com';

    // Send email using EmailService
    await this.emailService.sendAccessRequestEmail(supportEmail, {
      id: request.id,
      name: request.name,
      email: request.email,
      role: request.role,
    });

    return request;
  }

  async getNotifications(organizationId: string) {
    return this.prisma.notification.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markNotificationRead(organizationId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, organizationId },
      data: { isRead: true }
    });
  }

  async getUserMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserName(userId: string, name: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  async updateUserPreferences(userId: string, preferences: any) {
    // Merge existing with new
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    const currentPrefs = typeof user.preferences === 'object' && user.preferences !== null 
      ? user.preferences 
      : {};
      
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        preferences: {
          ...currentPrefs,
          ...preferences
        }
      },
      select: { preferences: true }
    });
  }
}
