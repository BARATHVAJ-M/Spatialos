import { Controller, Post, Patch, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Public } from './decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }, @Req() request: Request) {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const result = await this.authService.login(body.email, body.password, ip);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

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

}
