import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Inventory, stockStatus } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { MovementType, StockMovement } from '../entities/stock-movement.entity';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../common/auth';
import { paging } from '../common/helpers';
import { StockAdjustDto, StockInDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(StockMovement) private movements: Repository<StockMovement>,
    private activity: ActivityService,
    private db: DataSource,
  ) {}

  async list(query: { q?: string; status?: string; page?: string }) {
    const { page, pageSize, skip, take } = paging(query);
    const qb = this.products.createQueryBuilder('p').innerJoinAndSelect('p.inventory', 'inv').innerJoinAndSelect('p.category', 'sub')
      .orderBy('inv.quantityOnHand', 'ASC').addOrderBy('p.name', 'ASC').skip(skip).take(take);
    if (query.q) qb.andWhere(new Brackets((w) => w.where('p.name ILIKE :q', { q: `%${query.q}%` }).orWhere('p.sku ILIKE :q', { q: `%${query.q}%` })));
    if (query.status === 'out_of_stock') qb.andWhere('inv.quantityOnHand <= 0');
    if (query.status === 'low_stock') qb.andWhere('inv.quantityOnHand > 0 AND inv.quantityOnHand <= inv.reorderPoint');
    if (query.status === 'in_stock') qb.andWhere('inv.quantityOnHand > inv.reorderPoint');
    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map((p) => ({
      productId: p.id, name: p.name, sku: p.sku, unit: p.unit, imageUrl: p.imageUrl, subcategory: p.category.name, isActive: p.isActive,
      quantityOnHand: p.inventory.quantityOnHand, reorderPoint: p.inventory.reorderPoint, updatedAt: p.inventory.updatedAt,
      status: stockStatus(p.inventory.quantityOnHand, p.inventory.reorderPoint),
    }));
    return { items, total, page, pageSize };
  }

  stockIn(me: AuthUser, dto: StockInDto) {
    return this.move(me, dto.productId, 'stock_in', (qty) => qty + dto.quantity, dto.note || 'Stock received');
  }

  /** set stock to the counted number; the difference is saved as a correction (REQ-INV-5) */
  adjust(me: AuthUser, dto: StockAdjustDto) {
    return this.move(me, dto.productId, 'correction', () => dto.newQuantity, dto.reason, dto.reorderPoint);
  }

  async history(query: { productId?: string; type?: string; page?: string }) {
    const { page, pageSize, skip, take } = paging(query, 25);
    const qb = this.movements.createQueryBuilder('m').innerJoin('m.product', 'p').addSelect(['p.id', 'p.name', 'p.sku'])
      .leftJoin('m.staff', 's').addSelect(['s.id', 's.fullName']).orderBy('m.createdAt', 'DESC').skip(skip).take(take);
    if (query.productId) qb.andWhere('p.id = :pid', { pid: Number(query.productId) });
    if (query.type) qb.andWhere('m.movementType = :t', { t: query.type });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  // the inventory row is locked inside a transaction so two staff updating at once cannot lose a change
  private async move(me: AuthUser, productId: number, type: MovementType, next: (qty: number) => number, note: string, reorderPoint?: number) {
    return this.db.transaction(async (tx) => {
      const inv = await tx.getRepository(Inventory).createQueryBuilder('inv').innerJoinAndSelect('inv.product', 'p')
        .where('p.id = :productId', { productId }).setLock('pessimistic_write', undefined, ['inv']).getOne();
      if (!inv) throw new NotFoundException('Product not found.');
      const after = next(inv.quantityOnHand);
      if (after < 0) throw new BadRequestException('Stock cannot go below zero.');
      const change = after - inv.quantityOnHand;
      if (change === 0 && reorderPoint === undefined) throw new BadRequestException('The quantity is the same as the current stock.');

      await tx.update(Inventory, inv.id, { quantityOnHand: after, ...(reorderPoint !== undefined && { reorderPoint }) });
      if (change !== 0) await tx.save(StockMovement, { product: { id: productId }, staff: { id: me.id }, movementType: type, quantityChange: change, quantityAfter: after, note });
      const label = type === 'stock_in' ? 'Stock in' : 'Stock corrected';
      await this.activity.log(me.id, label, 'inventory', productId, `${inv.product.name}: ${change >= 0 ? '+' : ''}${change}, now ${after}. ${note}`);
      return { productId, quantityOnHand: after };
    });
  }
}
