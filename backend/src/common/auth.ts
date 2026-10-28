import {
  applyDecorators, CanActivate, createParamDecorator, ExecutionContext, ForbiddenException,
  Injectable, SetMetadata, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Staff } from '../entities/staff.entity';

export type TokenPayload = { sub: number; kind: 'customer' | 'staff'; role?: Role };
export type AuthUser = { id: number; kind: 'customer' | 'staff'; role?: Role; name?: string };

const KIND = 'auth:kind';
const ROLES_KEY = 'auth:roles';
const TEMP_OK = 'auth:tempPasswordOk';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const kind = this.meta<'customer' | 'staff'>(KIND, ctx);
    const req = ctx.switchToHttp().getRequest();
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    let payload: TokenPayload;
    try {
      payload = this.jwt.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Your session has ended. Please log in again.');
    }
    if (payload.kind !== kind) throw new ForbiddenException('You do not have permission to do this.');

    if (kind === 'staff') {
      // read the staff row on every request so a blocked account stops working straight away
      const staff = await this.staffRepo.findOneBy({ id: payload.sub });
      if (!staff || staff.status !== 'active') throw new UnauthorizedException('Your account is blocked.');
      const roles = this.meta<Role[]>(ROLES_KEY, ctx) || [];
      if (roles.length && staff.role !== 'SUPER_ADMIN' && !roles.includes(staff.role))
        throw new ForbiddenException('You do not have permission to view this page.');
      if (staff.mustChangePassword && !this.meta<boolean>(TEMP_OK, ctx))
        throw new ForbiddenException('Please change your temporary password first.');
      req.user = { id: staff.id, kind, role: staff.role, name: staff.fullName };
    } else {
      req.user = { id: payload.sub, kind };
    }
    return true;
  }

  private meta<T>(key: string, ctx: ExecutionContext) {
    return this.reflector.getAllAndOverride<T>(key, [ctx.getHandler(), ctx.getClass()]);
  }
}

/** @CustomerOnly() – route needs a logged-in customer */
export const CustomerOnly = () => applyDecorators(SetMetadata(KIND, 'customer'), UseGuards(AuthGuard));

/** @StaffOnly('SUB_ADMIN') – route needs staff; Super Admin is always allowed */
export const StaffOnly = (...roles: Role[]) =>
  applyDecorators(SetMetadata(KIND, 'staff'), SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard));

/** lets staff with a temporary password reach this route (change password, me, logout) */
export const AllowTempPassword = () => SetMetadata(TEMP_OK, true);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser =>
  ctx.switchToHttp().getRequest().user,
);
