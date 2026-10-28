import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { OtpVerification } from '../entities/otp.entity';
import { normalizePhone } from '../common/helpers';
import { RecaptchaService } from '../common/recaptcha.service';
import { SmsService } from '../common/sms.service';
import { LoginDto, RequestOtpDto, SignupDto } from './dto';

const OTP_LIFE_MS = 5 * 60 * 1000;
const RESEND_AFTER_S = 60;
const MAX_PER_HOUR = 5;
const MAX_TRIES = 5;

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(Customer) private customers: Repository<Customer>,
    @InjectRepository(OtpVerification) private otps: Repository<OtpVerification>,
    private recaptcha: RecaptchaService,
    private sms: SmsService,
    private jwt: JwtService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const phone = normalizePhone(dto.phone);
    await this.recaptcha.verify(dto.recaptchaToken);

    const existing = await this.customers.findOneBy({ phoneNumber: phone });
    if (dto.purpose === 'signup' && existing) throw new ConflictException('This number is already registered. Please log in instead.');
    if (dto.purpose === 'login' && !existing) throw new NotFoundException('No account found with this number.');
    if (existing?.status === 'blocked') throw new ForbiddenException('Your account is blocked. Please contact customer support.');

    const lastHour = await this.otps.find({
      where: { phoneNumber: phone, createdAt: MoreThan(new Date(Date.now() - 3600_000)) },
      order: { createdAt: 'DESC' },
    });
    if (lastHour.length >= MAX_PER_HOUR) throw new HttpException('Too many codes requested. Try again in an hour.', HttpStatus.TOO_MANY_REQUESTS);
    const waited = lastHour[0] ? (Date.now() - lastHour[0].createdAt.getTime()) / 1000 : Infinity;
    if (waited < RESEND_AFTER_S)
      throw new HttpException(`Please wait ${Math.ceil(RESEND_AFTER_S - waited)}s before asking for a new code.`, HttpStatus.TOO_MANY_REQUESTS);

    const code = String(randomInt(100000, 1000000));
    const otp = await this.otps.save({ phoneNumber: phone, purpose: dto.purpose, otpHash: this.hash(code), expiresAt: new Date(Date.now() + OTP_LIFE_MS) });
    try {
      await this.sms.sendOtp(phone, code);
    } catch (e) {
      await this.otps.delete(otp.id); // a code that never arrived should not count against the hourly limit
      throw e;
    }
    return { message: 'Code sent.', resendIn: RESEND_AFTER_S, expiresIn: OTP_LIFE_MS / 1000 };
  }

  async signup(dto: SignupDto) {
    if (!dto.acceptTerms) throw new BadRequestException('Please accept the Terms and Privacy Policy.');
    const phone = normalizePhone(dto.phone);
    if (await this.customers.findOneBy({ phoneNumber: phone })) throw new ConflictException('This number is already registered. Please log in instead.');
    await this.useOtp(phone, 'signup', dto.otp);
    const customer = await this.customers.save({
      firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), phoneNumber: phone,
      email: dto.email?.trim().toLowerCase() || null, lastLoginAt: new Date(),
    });
    return this.session(customer);
  }

  async login(dto: LoginDto) {
    const phone = normalizePhone(dto.phone);
    const customer = await this.customers.findOneBy({ phoneNumber: phone });
    if (!customer) throw new NotFoundException('No account found with this number.');
    if (customer.status === 'blocked') throw new ForbiddenException('Your account is blocked. Please contact customer support.');
    await this.useOtp(phone, 'login', dto.otp);
    await this.customers.update(customer.id, { lastLoginAt: new Date() });
    return this.session(customer);
  }

  private async useOtp(phone: string, purpose: 'signup' | 'login', code: string) {
    const otp = await this.otps.findOne({ where: { phoneNumber: phone, purpose, isUsed: false }, order: { createdAt: 'DESC' } });
    if (!otp || otp.expiresAt < new Date()) throw new BadRequestException('The code has expired. Please request a new one.');
    if (otp.attemptCount >= MAX_TRIES) throw new BadRequestException('Too many wrong tries. Please request a new code.');
    if (otp.otpHash !== this.hash(code)) {
      await this.otps.increment({ id: otp.id }, 'attemptCount', 1);
      throw new BadRequestException('The code is wrong. Please check and try again.');
    }
    await this.otps.update(otp.id, { isUsed: true });
  }

  private hash(code: string) {
    return createHash('sha256').update(code + process.env.JWT_SECRET).digest('hex');
  }

  private session(c: Customer) {
    const token = this.jwt.sign({ sub: c.id, kind: 'customer' }, { expiresIn: '7d' });
    return { token, customer: { id: c.id, firstName: c.firstName, lastName: c.lastName, phoneNumber: c.phoneNumber, email: c.email } };
  }
}
