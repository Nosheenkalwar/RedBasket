import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { WishlistItem } from '../entities/wishlist.entity';
import { PRODUCT_RELATIONS, productCard } from '../common/product-view';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem) private wishlist: Repository<WishlistItem>,
    @InjectRepository(Product) private products: Repository<Product>,
  ) {}

  async list(customerId: number) {
    const rows = await this.wishlist.find({
      where: { customer: { id: customerId }, product: { isActive: true } },
      relations: { product: PRODUCT_RELATIONS },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => productCard(r.product));
  }

  async add(customerId: number, productId: number) {
    if (!(await this.products.existsBy({ id: productId, isActive: true }))) throw new NotFoundException('This product is not available.');
    // the unique key stops duplicates; orIgnore makes a second tap harmless (REQ-WSH-2)
    await this.wishlist.createQueryBuilder().insert().values({ customer: { id: customerId }, product: { id: productId } }).orIgnore().execute();
    return this.list(customerId);
  }

  async remove(customerId: number, productId: number) {
    await this.wishlist.delete({ customer: { id: customerId }, product: { id: productId } });
    return this.list(customerId);
  }
}
