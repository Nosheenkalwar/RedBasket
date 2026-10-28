import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Brackets, Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../common/auth';
import { StaffDto } from './dto';

const ROLE_NAMES = { SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Sub Admin', INVENTORY_STAFF: 'Inventory Staff', SALES_STAFF: 'Sales Staff' };

@Injectable()
export class StaffService {
  constructor(@InjectRepository(Staff) private staff: Repository<Staff>, private activity: ActivityService) {}

  list(query: { q?: string; role?: string; status?: string }) {
    const qb = this.staff.createQueryBuilder('s').orderBy('s.createdAt', 'ASC');
    if (query.q) qb.andWhere(new Brackets((w) => w.where('s.fullName ILIKE :q', { q: `%${query.q}%` }).orWhere('s.email ILIKE :q', { q: `%${query.q}%` })));
    if (query.role) qb.andWhere('s.role = :role', { role: query.role });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    return qb.getMany();
  }

  async create(me: AuthUser, dto: StaffDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.staff.existsBy({ email })) throw new ConflictException('This email is already used by another staff member.');
    const tempPassword = this.tempPassword();
    const s = await this.staff.save({
      fullName: dto.fullName.trim(), email, phone: dto.phone || null, role: dto.role,
      passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true,
    });
    await this.activity.log(me.id, 'Staff created', 'staff', s.id, `Added ${s.fullName} as ${ROLE_NAMES[s.role]}`);
    // shown once to the Super Admin, never stored in plain text
    return { staff: await this.find(s.id), tempPassword };
  }

  async update(me: AuthUser, id: number, dto: StaffDto) {
    const s = await this.find(id);
    if (s.role === 'SUPER_ADMIN') throw new BadRequestException('The Super Admin account cannot be edited here.');
    const email = dto.email.trim().toLowerCase();
    const clash = await this.staff.findOneBy({ email });
    if (clash && clash.id !== id) throw new ConflictException('This email is already used by another staff member.');

    const changes: string[] = [];
    if (s.role !== dto.role) changes.push(`role ${ROLE_NAMES[s.role]} to ${ROLE_NAMES[dto.role]}`);
    if (s.fullName !== dto.fullName.trim()) changes.push('name');
    if (s.email !== email) changes.push('email');
    if ((s.phone || '') !== (dto.phone || '')) changes.push('phone');
    await this.staff.update(id, { fullName: dto.fullName.trim(), email, phone: dto.phone || null, role: dto.role });
    if (changes.length) await this.activity.log(me.id, 'Staff updated', 'staff', id, `${dto.fullName}: changed ${changes.join(', ')}`);
    return this.find(id);
  }

  async setStatus(me: AuthUser, id: number, status: 'active' | 'blocked') {
    if (id === me.id) throw new BadRequestException('You cannot block your own account.');
    const s = await this.find(id);
    if (s.role === 'SUPER_ADMIN') throw new BadRequestException('The Super Admin account cannot be blocked.');
    await this.staff.update(id, { status, failedAttempts: 0, lockedUntil: null });
    await this.activity.log(me.id, status === 'blocked' ? 'Staff blocked' : 'Staff unblocked', 'staff', id, s.fullName);
    return this.find(id);
  }

  async resetPassword(me: AuthUser, id: number) {
    const s = await this.find(id);
    if (id === me.id) throw new BadRequestException('Change your own password from your profile menu.');
    const tempPassword = this.tempPassword();
    await this.staff.update(id, { passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true, failedAttempts: 0, lockedUntil: null });
    await this.activity.log(me.id, 'Password reset', 'staff', id, `Temporary password issued to ${s.fullName}`);
    return { staff: s, tempPassword };
  }

  private async find(id: number) {
    const s = await this.staff.findOneBy({ id });
    if (!s) throw new NotFoundException('Staff member not found.');
    return s;
  }

  /** e.g. RB-k3F9-x7Qa2 : letters and numbers so it passes the password rule */
  private tempPassword() {
    const r = randomBytes(6).toString('base64url');
    return `RB-${r.slice(0, 4)}-${r.slice(4)}${Math.floor(Math.random() * 90 + 10)}`;
  }
}
