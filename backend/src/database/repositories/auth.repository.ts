import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateLoginAttempts(userId: string, attempts: number, lockedUntil: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: attempts, lockedUntil },
    });
  }

  async createAuditLog(userId: string | null, email: string, ipAddress: string, status: string) {
    return this.prisma.authAuditLog.create({
      data: { userId, email, ipAddress, status },
    });
  }

  async createUser(name: string, email: string, role: string, passwordHash: string = '', verificationToken?: string, verificationTokenExpiry?: Date) {
    let org = await this.prisma.organization.findFirst();
    if (!org) {
      org = await this.prisma.organization.create({
        data: { name: 'Default Org', slug: 'default' }
      });
    }

    return this.prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        organizationId: org.id,
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
      },
    });
  }

  async findByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
  }

  async findByResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: { resetToken: token },
    });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async incrementOtpAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { otpAttempts: { increment: 1 } },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
