import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { paging } from '../common/helpers';

@Injectable()
export class ActivityService {
  constructor(@InjectRepository(ActivityLog) private repo: Repository<ActivityLog>) {}

  log(staffId: number, action: string, entityType: string, entityId: number | null, description: string) {
    return this.repo.save({ staff: { id: staffId }, action, entityType, entityId, description });
  }

  async list(query: { staffId?: string; from?: string; to?: string; q?: string; page?: string }) {
    const { page, pageSize, skip, take } = paging(query, 25);
    const qb = this.repo.createQueryBuilder('l').leftJoin('l.staff', 's').addSelect(['s.id', 's.fullName', 's.role'])
      .orderBy('l.createdAt', 'DESC').skip(skip).take(take);
    if (query.staffId) qb.andWhere('s.id = :sid', { sid: Number(query.staffId) });
    if (query.from) qb.andWhere('l.createdAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('l.createdAt < :to', { to: new Date(new Date(query.to).getTime() + 86400000) });
    if (query.q) qb.andWhere(new Brackets((w) =>
      w.where('l.action ILIKE :q', { q: `%${query.q}%` }).orWhere('l.description ILIKE :q', { q: `%${query.q}%` })));
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }
}
