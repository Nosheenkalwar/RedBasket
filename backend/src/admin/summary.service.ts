import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Inventory } from '../entities/inventory.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { Role, Staff } from '../entities/staff.entity';

type Card = { label: string; value: number; hint: string; money?: boolean };

/** the numbers on the dashboard cards, only the ones a role is allowed to see */
@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Category) private categories: Repository<Category>,
    @InjectRepository(Inventory) private inventory: Repository<Inventory>,
    @InjectRepository(Staff) private staff: Repository<Staff>,
    @InjectRepository(Order) private orders: Repository<Order>,
  ) {}

  async forRole(role: Role) {
    const cards: Card[] = [];
    const all = role === 'SUPER_ADMIN';
    if (all || role === 'SALES_STAFF' || role === 'SUB_ADMIN') {
      const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) + 'T00:00:00+05:00');
      const sales = await this.orders.createQueryBuilder('o').select('COALESCE(SUM(o.total), 0)', 'sum').addSelect('COUNT(*)', 'n')
        .where('o.placedAt >= :today AND o.status != :c', { today, c: 'cancelled' }).getRawOne();
      cards.push({ label: 'Sales today', value: Number(sales.sum), hint: `${sales.n} order${sales.n === '1' ? '' : 's'} so far`, money: true });
      cards.push({ label: 'Waiting to confirm', value: await this.orders.countBy({ status: 'placed' }), hint: 'New orders' });
      cards.push({ label: 'To pack', value: await this.orders.countBy({ status: 'confirmed' }), hint: 'Confirmed orders' });
      cards.push({ label: 'On the road', value: await this.orders.countBy({ status: 'out_for_delivery' }), hint: 'Out for delivery' });
    }
    if (all || role === 'SUB_ADMIN') {
      cards.push({ label: 'Active products', value: await this.products.countBy({ isActive: true }), hint: 'Shown in the store' });
      cards.push({ label: 'Sub-categories', value: await this.categories.createQueryBuilder('c').where('c.parentId IS NOT NULL').getCount(), hint: 'Across all categories' });
    }
    if (all || role === 'INVENTORY_STAFF') {
      const low = await this.inventory.createQueryBuilder('i').where('i.quantityOnHand > 0 AND i.quantityOnHand <= i.reorderPoint').getCount();
      cards.push({ label: 'Low stock', value: low, hint: 'At or below reorder point' });
      cards.push({ label: 'Out of stock', value: await this.inventory.countBy({ quantityOnHand: 0 }), hint: 'Need stock-in' });
    }
    if (all) cards.push({ label: 'Staff accounts', value: await this.staff.countBy({ status: 'active' }), hint: 'Active accounts' });
    return { cards };
  }
}
