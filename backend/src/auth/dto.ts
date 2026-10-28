import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export const NAME = /^[A-Za-z\u0600-\u06FF .'-]+$/;
export const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class RequestOtpDto {
  @IsString() phone: string;
  @IsIn(['signup', 'login']) purpose: 'signup' | 'login';
  @IsString() @IsNotEmpty({ message: 'Please tick "I\'m not a robot".' }) recaptchaToken: string;
}

export class LoginDto {
  @IsString() phone: string;
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code.' }) otp: string;
}

export class SignupDto extends LoginDto {
  @Length(2, 30, { message: 'First name should be 2 to 30 letters.' }) @Matches(NAME, { message: 'Names can only have letters.' }) firstName: string;
  @Length(2, 30, { message: 'Last name should be 2 to 30 letters.' }) @Matches(NAME, { message: 'Names can only have letters.' }) lastName: string;
  @IsOptional() @IsEmail({}, { message: 'Enter a valid email or leave it empty.' }) @MaxLength(100) email?: string;
  @IsBoolean() acceptTerms: boolean;
}

export class StaffLoginDto {
  @IsEmail({}, { message: 'Enter a valid email.' }) email: string;
  @IsString() @IsNotEmpty({ message: 'Enter your password.' }) password: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @Matches(PASSWORD, { message: 'Use at least 8 characters with letters and numbers.' }) newPassword: string;
}
