import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { paging } from '../common/helpers';
import { productCard } from '../common/product-view';

export type ProductQuery = {
  q?: string; category?: string; sub?: string; brands?: string;
  minPrice?: string; maxPrice?: string; inStock?: string; sort?: string; page?: string; pageSize?: string;
};

const SORTS: Record<string, [string, 'ASC' | 'DESC']> = {
  newest: ['p.createdAt', 'DESC'],
  price_asc: ['p.price', 'ASC'],
  price_desc: ['p.price', 'DESC'],
  name: ['p.name', 'ASC'],
};

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category) private categories: Repository<Category>,
    @InjectRepository(Product) private products: Repository<Product>,
  ) {}

  /** active categories with their active sub-categories and how many products each has */
  async tree() {
    const counts = await this.visible().select('sub.id', 'id').addSelect('COUNT(*)', 'n').groupBy('sub.id').getRawMany();
    const countOf = Object.fromEntries(counts.map((c) => [c.id, Number(c.n)]));
    const cats = await this.categories.find({
      where: { parent: IsNull(), isActive: true },
      relations: { children: true },
      order: { id: 'ASC', children: { id: 'ASC' } },
    });
    return cats.map((c) => {
      const subs = c.children.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name, productCount: countOf[s.id] || 0 }));
      return { id: c.id, name: c.name, productCount: subs.reduce((a, s) => a + s.productCount, 0), subcategories: subs };
    });
  }

  async list(query: ProductQuery) {
    const { page, pageSize, skip, take } = paging(query);
    const qb = this.visible();
    if (query.q) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(new Brackets((w) => w.where('p.name ILIKE :q', { q }).orWhere('p.brand ILIKE :q', { q }).orWhere('sub.name ILIKE :q', { q })));
    }
    if (query.category) qb.andWhere('cat.id = :cat', { cat: Number(query.category) });
    if (query.sub) qb.andWhere('sub.id = :sub', { sub: Number(query.sub) });
    if (query.minPrice) qb.andWhere('p.price >= :min', { min: Number(query.minPrice) });
    if (query.maxPrice) qb.andWhere('p.price <= :max', { max: Number(query.maxPrice) });
    if (query.inStock === 'true') qb.andWhere('inv.quantityOnHand > 0');

    // brands offered in the filter = brands that match everything except the brand filter itself
    const brands = (await qb.clone().select('DISTINCT p.brand', 'brand').orderBy('brand').getRawMany()).map((r) => r.brand);

    const picked = (query.brands || '').split(',').filter(Boolean);
    if (picked.length) qb.andWhere('p.brand IN (:...picked)', { picked });
    const [field, dir] = SORTS[query.sort || ''] || SORTS.newest;
    const [rows, total] = await qb.orderBy(field, dir).addOrderBy('p.id', 'DESC').skip(skip).take(take).getManyAndCount();
    return { items: rows.map(productCard), total, page, pageSize, brands };
  }

  /** quick results for the search box dropdown */
  async suggest(q = '') {
    if (!q.trim()) return [];
    const term = q.trim();
    const rows = await this.visible()
      .andWhere(new Brackets((w) => w.where('p.name ILIKE :any', { any: `%${term}%` }).orWhere('p.brand ILIKE :any', { any: `%${term}%` })))
      .orderBy('p.name').take(30).getMany();
    // names that start with the typed text come first
    const starts = (name: string) => (name.toLowerCase().startsWith(term.toLowerCase()) ? 0 : 1);
    return rows.sort((a, b) => starts(a.name) - starts(b.name)).slice(0, 5).map(productCard);
  }

  async detail(id: number) {
    const p = await this.visible().andWhere('p.id = :id', { id }).getOne();
    if (!p) throw new NotFoundException('This product is not available.');
    const related = await this.visible().andWhere('sub.id = :sub AND p.id != :id', { sub: p.category.id, id }).take(6).getMany();
    return { ...productCard(p), description: p.description, sku: p.sku, related: related.map(productCard) };
  }

  /** only active products whose category and sub-category are also active (REQ-BRW-6) */
  private visible(): SelectQueryBuilder<Product> {
    return this.products.createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'sub').innerJoinAndSelect('sub.parent', 'cat').leftJoinAndSelect('p.inventory', 'inv')
      .where('p.isActive = true AND sub.isActive = true AND cat.isActive = true');
  }
}
