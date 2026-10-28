import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../common/auth';
import { paging } from '../common/helpers';
import { ProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Category) private categories: Repository<Category>,
    @InjectRepository(StockMovement) private movements: Repository<StockMovement>,
    private activity: ActivityService,
  ) {}

  async list(query: { q?: string; categoryId?: string; status?: string; page?: string }) {
    const { page, pageSize, skip, take } = paging(query);
    const qb = this.products.createQueryBuilder('p')
      .innerJoinAndSelect('p.category', 'sub').innerJoinAndSelect('sub.parent', 'cat').leftJoinAndSelect('p.inventory', 'inv')
      .orderBy('p.createdAt', 'DESC').addOrderBy('p.id', 'DESC').skip(skip).take(take);
    if (query.q) qb.andWhere(new Brackets((w) => w.where('p.name ILIKE :q', { q: `%${query.q}%` }).orWhere('p.sku ILIKE :q', { q: `%${query.q}%` }).orWhere('p.brand ILIKE :q', { q: `%${query.q}%` })));
    if (query.categoryId) qb.andWhere('(sub.id = :c OR cat.id = :c)', { c: Number(query.categoryId) });
    if (query.status) qb.andWhere('p.isActive = :a', { a: query.status === 'active' });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async create(me: AuthUser, dto: ProductDto) {
    const category = await this.subcategory(dto.categoryId);
    await this.checkSku(dto.sku);
    // new products start with 0 stock; Inventory Staff add stock later
    const p = await this.products.save({ ...this.fields(dto), category, inventory: { quantityOnHand: 0 } });
    await this.activity.log(me.id, 'Product added', 'product', p.id, `${p.name} (${p.sku}) at Rs. ${p.price}`);
    return p;
  }

  async update(me: AuthUser, id: number, dto: ProductDto) {
    const p = await this.find(id);
    const category = await this.subcategory(dto.categoryId);
    if (dto.sku !== p.sku) await this.checkSku(dto.sku);
    await this.products.update(id, { ...this.fields(dto), category });
    const note = p.price !== dto.price ? `price Rs. ${p.price} to Rs. ${dto.price}` : 'details updated';
    await this.activity.log(me.id, p.price !== dto.price ? 'Price changed' : 'Product updated', 'product', id, `${dto.name}: ${note}`);
    return this.find(id);
  }

  async setActive(me: AuthUser, id: number, isActive: boolean) {
    const p = await this.find(id);
    await this.products.update(id, { isActive });
    await this.activity.log(me.id, isActive ? 'Product shown' : 'Product hidden', 'product', id, p.name);
    return this.find(id);
  }

  /** delete only if the product has no stock history; otherwise it must be hidden (REQ-PRD-6) */
  async remove(me: AuthUser, id: number) {
    const p = await this.find(id);
    if (await this.movements.existsBy({ product: { id } })) throw new ConflictException(`${p.name} has stock history. Hide it instead of deleting.`);
    await this.products.delete(id);
    await this.activity.log(me.id, 'Product deleted', 'product', id, `${p.name} (${p.sku})`);
    return { message: 'Product deleted.' };
  }

  private fields(dto: ProductDto) {
    return {
      name: dto.name.trim(), sku: dto.sku, brand: dto.brand.trim(), unit: dto.unit.trim(), price: dto.price,
      costPrice: dto.costPrice ?? null, leadTimeDays: dto.leadTimeDays, description: dto.description?.trim() || '',
      imageUrl: dto.imageUrl || null, ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }

  private async find(id: number) {
    const p = await this.products.findOne({ where: { id }, relations: { category: { parent: true }, inventory: true } });
    if (!p) throw new NotFoundException('Product not found.');
    return p;
  }

  private async subcategory(id: number) {
    const c = await this.categories.findOne({ where: { id }, relations: { parent: true } });
    if (!c || !c.parent) throw new BadRequestException('Choose a sub-category for the product.');
    return c;
  }

  private async checkSku(sku: string) {
    if (await this.products.existsBy({ sku })) throw new ConflictException(`SKU ${sku} is already used by another product.`);
  }
}
