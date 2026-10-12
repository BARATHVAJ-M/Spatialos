import { Injectable, UnauthorizedException, ConflictException, Logger, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthRepository } from '../database/repositories/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async login(email: string, pass: string, ipAddress: string = 'unknown'): Promise<{ token: string; user: any }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    
    if (!user) {
      await bcrypt.hash(pass, 10); // Mitigation for timing attacks
      await this.authRepository.createAuditLog(null, email, ipAddress, 'FAILED_USER_NOT_FOUND');
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      await this.authRepository.createAuditLog(user.id, email, ipAddress, 'FAILED_LOCKED_OUT');
      throw new UnauthorizedException('Account is temporarily locked due to too many failed attempts. Try again later.');
    }

    // Note: Verification check moved below password check to prevent account enumeration.

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

    // MVP: Must be verified before login
    // Checking this AFTER password validation prevents attackers from enumerating valid emails.
    if (!user.isVerified) {
      await this.authRepository.createAuditLog(user.id, email, ipAddress, 'FAILED_UNVERIFIED');
      throw new ForbiddenException('Please verify your email before logging in.');
    }

    // Success! Reset attempts and generate token
    await this.authRepository.updateLoginAttempts(user.id, 0, null);
    await this.authRepository.createAuditLog(user.id, email, ipAddress, 'SUCCESS');

    // Note: The previous logic hard-blocked non-ADMIN users here.
    // That has been removed so mobile users can log in.
    // Dashboard (Admin) protection should be enforced via Role Guards on specific Dashboard endpoints.


    const payload = { sub: user.id, id: user.id, email: user.email, role: user.role, orgId: user.organizationId };
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

  async updateProfileName(userId: string, newName: string): Promise<any> {
    const user = await this.authRepository.updateUser(userId, { name: newName });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(name: string, email: string, pass: string): Promise<{ message: string; userId: string }> {
    const existing = await this.authRepository.findByEmail(email.toLowerCase());
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    // Generate 6-digit OTP using cryptographically secure random generator
    const verificationToken = crypto.randomInt(100000, 1000000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.authRepository.createUser(
      name,
      email.toLowerCase(), 
      'USER', 
      passwordHash, 
      verificationToken, 
      verificationTokenExpiry
    );
    
    // Set lastOtpSentAt on creation
    await this.authRepository.updateUser(user.id, { lastOtpSentAt: new Date() });
    // Emit event instead of awaiting email. The event listener handles sending and retries.
    this.eventEmitter.emit('auth.registered', { email: user.email, otp: verificationToken });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.isVerified) {
      return { message: 'Email is already verified.' };
    }

    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      throw new ForbiddenException('You have exceeded maximum OTP attempts. Please try again after 24 hours.');
    }

    if (!user.verificationToken || user.verificationToken !== otp) {
      const updatedUser = await this.authRepository.incrementOtpAttempts(user.id);
      let lockedUntil = null;
      if (updatedUser.otpAttempts >= 3) {
        lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Lock for 24 hours
        await this.authRepository.updateUser(user.id, { otpLockedUntil: lockedUntil });
      }
      throw new BadRequestException(lockedUntil ? 'Too many failed attempts. Locked for 24 hours.' : 'Invalid verification code.');
    }

    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    await this.authRepository.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
      otpAttempts: 0,
      otpLockedUntil: null,
      lastOtpSentAt: null,
    });

    return { message: 'Email successfully verified. You can now log in.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    
    if (!user) {
      await bcrypt.hash('dummy_string', 10); // Mitigation for timing attacks
      // Return success even if user not found to prevent email enumeration
      return { message: 'If an account with that email exists, a password reset code has been sent.' };
    }

    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      throw new ForbiddenException('Your account is temporarily locked from requesting OTPs. Please try again after 24 hours.');
    }

    if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < 2 * 60 * 1000) {
      throw new HttpException('Please wait at least 2 minutes before requesting a new code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Generate 6-digit OTP using cryptographically secure random generator
    const resetToken = crypto.randomInt(100000, 1000000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.authRepository.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
      otpAttempts: 0, // Reset attempts when a new OTP is requested
      otpLockedUntil: null,
      lastOtpSentAt: new Date(),
    });

    // Emit event instead of waiting
    this.eventEmitter.emit('auth.password_reset', { email: user.email, otp: resetToken });

    return { message: 'If an account with that email exists, a password reset code has been sent.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());

    if (!user) {
      await bcrypt.hash(newPassword, 10); // Mitigation for timing attacks
      throw new BadRequestException('Invalid request.');
    }

    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      throw new ForbiddenException('You have exceeded maximum OTP attempts. Please try again after 24 hours.');
    }

    if (!user.resetToken || user.resetToken !== otp) {
      const updatedUser = await this.authRepository.incrementOtpAttempts(user.id);
      let lockedUntil = null;
      if (updatedUser.otpAttempts >= 3) {
        lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Lock for 24 hours
        await this.authRepository.updateUser(user.id, { otpLockedUntil: lockedUntil });
      }
      throw new BadRequestException(lockedUntil ? 'Too many failed attempts. Locked for 24 hours.' : 'Invalid reset code.');
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Password reset code has expired. Please request a new one.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.authRepository.updateUser(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      otpAttempts: 0,
      otpLockedUntil: null,
      lastOtpSentAt: null,
    });

    return { message: 'Password has been successfully reset. You can now log in.' };
  }
}
