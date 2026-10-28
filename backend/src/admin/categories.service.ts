import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../common/auth';
import { CategoryDto, CategoryUpdateDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categories: Repository<Category>,
    @InjectRepository(Product) private products: Repository<Product>,
    private activity: ActivityService,
  ) {}

  /** every category and sub-category, hidden ones included, with product counts */
  async tree() {
    const counts = await this.products.createQueryBuilder('p').select('p.categoryId', 'id').addSelect('COUNT(*)', 'n')
      .addSelect('SUM(CASE WHEN p.isActive THEN 1 ELSE 0 END)', 'active').groupBy('p.categoryId').getRawMany();
    const count = Object.fromEntries(counts.map((c) => [c.id, { total: Number(c.n), active: Number(c.active) }]));
    const cats = await this.categories.find({ where: { parent: IsNull() }, relations: { children: true }, order: { id: 'ASC', children: { id: 'ASC' } } });
    return cats.map((c) => ({
      id: c.id, name: c.name, isActive: c.isActive,
      subcategories: c.children.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive, products: count[s.id]?.total || 0, activeProducts: count[s.id]?.active || 0 })),
    }));
  }

  async create(me: AuthUser, dto: CategoryDto) {
    const parent = dto.parentId ? await this.find(dto.parentId) : null;
    if (parent?.parent) throw new BadRequestException('Sub-categories can only be added under a main category.');
    await this.checkName(dto.name, parent?.id ?? null);
    const c = await this.categories.save({ name: dto.name.trim(), parent });
    await this.activity.log(me.id, parent ? 'Sub-category added' : 'Category added', 'category', c.id, parent ? `${c.name} under ${parent.name}` : c.name);
    return this.tree();
  }

  async update(me: AuthUser, id: number, dto: CategoryUpdateDto) {
    const c = await this.find(id);
    if (dto.name && dto.name.trim() !== c.name) {
      await this.checkName(dto.name, c.parent?.id ?? null, id);
      await this.activity.log(me.id, 'Category renamed', 'category', id, `${c.name} to ${dto.name.trim()}`);
    }
    // hiding a category also hides its products from the store; they come back when it is published again
    if (dto.isActive === false && c.isActive) await this.activity.log(me.id, 'Category hidden', 'category', id, c.name);
    if (dto.isActive === true && !c.isActive) await this.activity.log(me.id, 'Category published', 'category', id, c.name);
    await this.categories.update(id, { ...(dto.name && { name: dto.name.trim() }), ...(dto.isActive !== undefined && { isActive: dto.isActive }) });
    return this.tree();
  }

  /** a real delete is only allowed when nothing uses the category; otherwise hide it (REQ-PRD-6) */
  async remove(me: AuthUser, id: number) {
    const c = await this.find(id);
    if (await this.categories.existsBy({ parent: { id } })) throw new ConflictException(`Delete or move the sub-categories of ${c.name} first.`);
    if (await this.products.existsBy({ category: { id } })) throw new ConflictException(`${c.name} has products. Hide it instead of deleting.`);
    await this.categories.delete(id);
    await this.activity.log(me.id, 'Category deleted', 'category', id, c.name);
    return this.tree();
  }

  private async find(id: number) {
    const c = await this.categories.findOne({ where: { id }, relations: { parent: true, children: true } });
    if (!c) throw new NotFoundException('Category not found.');
    return c;
  }

  private async checkName(name: string, parentId: number | null, exceptId?: number) {
    const same = await this.categories.createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name)', { name: name.trim() })
      .andWhere(parentId ? 'c.parentId = :parentId' : 'c.parentId IS NULL', { parentId })
      .getOne();
    if (same && same.id !== exceptId) throw new ConflictException(`"${name.trim()}" already exists here.`);
  }
}
