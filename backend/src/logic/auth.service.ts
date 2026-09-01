import { Injectable, UnauthorizedException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { AuthRepository } from '../database/repositories/auth.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, pass: string, ipAddress: string = 'unknown'): Promise<{ token: string; user: any }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    
    if (!user) {
      await this.authRepository.createAuditLog(null, email, ipAddress, 'FAILED_USER_NOT_FOUND');
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      await this.authRepository.createAuditLog(user.id, email, ipAddress, 'FAILED_LOCKED_OUT');
      throw new UnauthorizedException('Account is temporarily locked due to too many failed attempts. Try again later.');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = user.loginAttempts + 1;
      let lockedUntil = null;
      let status = 'FAILED_BAD_PASSWORD';

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        status = 'LOCKED';
      }

      await this.authRepository.updateLoginAttempts(user.id, attempts, lockedUntil);
      await this.authRepository.createAuditLog(user.id, email, ipAddress, status);

      throw new UnauthorizedException('Invalid email or password');
    }

    // Success! Reset attempts and generate token
    await this.authRepository.updateLoginAttempts(user.id, 0, null);
    await this.authRepository.createAuditLog(user.id, email, ipAddress, 'SUCCESS');

    // Only allow ADMIN for dashboard
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access this dashboard.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(name: string, email: string, pass: string): Promise<{ token: string; user: any }> {
    const existing = await this.authRepository.findByEmail(email.toLowerCase());
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    // According to requirements, all new registrations are just regular users
    const user = await this.authRepository.createUser(email.toLowerCase(), 'USER', passwordHash);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
