import { BadRequestException, ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { ActivityService } from '../activity/activity.service';
import { ChangePasswordDto, StaffLoginDto } from './dto';

const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class StaffAuthService {
  constructor(
    @InjectRepository(Staff) private staff: Repository<Staff>,
    private activity: ActivityService,
    private jwt: JwtService,
  ) {}

  async login(dto: StaffLoginDto) {
    const s = await this.withPassword().where('s.email = :email', { email: dto.email.trim().toLowerCase() }).getOne();
    const wrong = new UnauthorizedException('Email or password is incorrect.');
    if (!s) throw wrong;

    if (s.lockedUntil && s.lockedUntil > new Date()) {
      const mins = Math.ceil((s.lockedUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(`Too many wrong attempts. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`, 423);
    }
    if (s.status === 'blocked') throw new ForbiddenException('Your account is blocked. Please contact the Super Admin.');

    if (!(await bcrypt.compare(dto.password, s.passwordHash))) {
      const tries = s.failedAttempts + 1;
      const locked = tries >= MAX_TRIES;
      await this.staff.update(s.id, { failedAttempts: locked ? 0 : tries, lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60000) : null });
      if (locked) throw new HttpException(`Too many wrong attempts. Your account is locked for ${LOCK_MINUTES} minutes.`, 423);
      throw wrong;
    }

    await this.staff.update(s.id, { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
    await this.activity.log(s.id, 'Logged in', 'session', s.id, `${s.fullName} logged in`);
    const token = this.jwt.sign({ sub: s.id, kind: 'staff', role: s.role }, { expiresIn: '8h' });
    return { token, staff: this.view(s) };
  }

  async me(id: number) {
    return this.view(await this.staff.findOneByOrFail({ id }));
  }

  async logout(id: number, name: string) {
    await this.activity.log(id, 'Logged out', 'session', id, `${name} logged out`);
    return { message: 'Logged out.' };
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const s = await this.withPassword().where('s.id = :id', { id }).getOneOrFail();
    if (!(await bcrypt.compare(dto.currentPassword, s.passwordHash))) throw new BadRequestException('Current password is not correct.');
    if (dto.currentPassword === dto.newPassword) throw new BadRequestException('Choose a password different from the current one.');
    await this.staff.update(id, { passwordHash: await bcrypt.hash(dto.newPassword, 10), mustChangePassword: false });
    await this.activity.log(id, 'Password changed', 'staff', id, `${s.fullName} changed their password`);
    return this.me(id);
  }

  private withPassword() {
    return this.staff.createQueryBuilder('s').addSelect('s.passwordHash');
  }

  private view(s: Staff) {
    return { id: s.id, fullName: s.fullName, email: s.email, phone: s.phone, role: s.role, mustChangePassword: s.mustChangePassword };
  }
}
