import { Body, Controller, Get, Post } from '@nestjs/common';
import { AllowTempPassword, AuthUser, CurrentUser, StaffOnly } from '../common/auth';
import { CustomerAuthService } from './customer-auth.service';
import { StaffAuthService } from './staff-auth.service';
import { ChangePasswordDto, LoginDto, RequestOtpDto, SignupDto, StaffLoginDto } from './dto';

@Controller('auth')
export class CustomerAuthController {
  constructor(private auth: CustomerAuthService) {}

  @Post('otp') requestOtp(@Body() dto: RequestOtpDto) { return this.auth.requestOtp(dto); }
  @Post('signup') signup(@Body() dto: SignupDto) { return this.auth.signup(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}

@Controller('staff-auth')
export class StaffAuthController {
  constructor(private auth: StaffAuthService) {}

  @Post('login') login(@Body() dto: StaffLoginDto) { return this.auth.login(dto); }

  @Get('me') @StaffOnly() @AllowTempPassword()
  me(@CurrentUser() u: AuthUser) { return this.auth.me(u.id); }

  @Post('logout') @StaffOnly() @AllowTempPassword()
  logout(@CurrentUser() u: AuthUser) { return this.auth.logout(u.id, u.name!); }

  @Post('change-password') @StaffOnly() @AllowTempPassword()
  changePassword(@CurrentUser() u: AuthUser, @Body() dto: ChangePasswordDto) { return this.auth.changePassword(u.id, dto); }
}
