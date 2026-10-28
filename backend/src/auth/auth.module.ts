import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { OtpVerification } from '../entities/otp.entity';
import { CustomerAuthController, StaffAuthController } from './auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { StaffAuthService } from './staff-auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, OtpVerification])],
  controllers: [CustomerAuthController, StaffAuthController],
  providers: [CustomerAuthService, StaffAuthService],
})
export class AuthModule {}
