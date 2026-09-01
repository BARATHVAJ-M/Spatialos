import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../api/auth.controller';
import { AuthService } from '../logic/auth.service';
import { AuthRepository } from '../database/repositories/auth.repository';

export const jwtConstants = {
  secret: 'SUPER_SECRET_KEY_FOR_JWT_SPATIAL_OS',
};

@Module({
  imports: [
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
