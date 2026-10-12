import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../api/auth.controller';
import { AuthService } from '../logic/auth.service';
import { AuthRepository } from '../database/repositories/auth.repository';
import { EmailModule } from './email.module';

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_FOR_JWT_SPATIAL_OS',
};

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository, JwtModule],
})
export class AuthModule {}
