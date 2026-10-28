import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from '../entities/staff.entity';
import { AuthGuard } from './auth';
import { RecaptchaService } from './recaptcha.service';
import { SmsService } from './sms.service';

// shared by every feature module: JWT, the auth guard (needs the staff table), reCAPTCHA and SMS
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET }) }),
    TypeOrmModule.forFeature([Staff]),
  ],
  providers: [AuthGuard, RecaptchaService, SmsService],
  exports: [JwtModule, TypeOrmModule, AuthGuard, RecaptchaService, SmsService],
})
export class CommonModule {}
