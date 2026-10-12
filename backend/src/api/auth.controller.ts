import { Controller, Post, Patch, Body, HttpCode, HttpStatus, Req, Query, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../logic/auth.service';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 reqs per 15 mins
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto, @Req() request: Request) {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const result = await this.authService.login(body.email, body.password, ip);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 reqs per 15 mins
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto) {
    const result = await this.authService.register(body.name, body.email, body.password);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 reqs per 15 mins
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: any) {
    const result = await this.authService.verifyEmail(body.email, body.otp);
    return {
      success: true,
      message: result.message,
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 reqs per 15 mins
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    const result = await this.authService.forgotPassword(email);
    return {
      success: true,
      message: result.message,
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 reqs per 15 mins
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    const result = await this.authService.resetPassword(body.email, body.otp, body.newPassword);
    return {
      success: true,
      message: result.message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req, @Body() body: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    const result = await this.authService.updateProfileName(userId, body.name);
    return {
      success: true,
      data: result,
    };
  }
}
