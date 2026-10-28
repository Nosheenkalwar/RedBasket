import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItem } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { PRODUCT_RELATIONS, productCard } from '../common/product-view';
import { FREE_DELIVERY_FROM } from '../shipping/shipping.rules';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private carts: Repository<Cart>,
    @InjectRepository(CartItem) private items: Repository<CartItem>,
    @InjectRepository(Product) private products: Repository<Product>,
  ) {}

  async get(customerId: number) {
    const cart = await this.cartOf(customerId);
    const rows = await this.items.find({ where: { cart: { id: cart.id } }, relations: { product: PRODUCT_RELATIONS }, order: { id: 'ASC' } });
    const lines = rows.map((r) => {
      const product = productCard(r.product);
      // stock may have dropped since the item was added, so show a note instead of failing (REQ-CRT-6)
      const note = !r.product.isActive ? 'No longer available' : product.stock < r.quantity
        ? (product.stock ? `Only ${product.stock} left` : 'Out of stock') : null;
      return { product, quantity: r.quantity, lineTotal: product.price * r.quantity, note };
    });
    const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
    // the delivery fee depends on the address, so it is worked out at checkout by the shipping rules
    return { items: lines, count: lines.reduce((a, l) => a + l.quantity, 0), subtotal, freeDeliveryFrom: FREE_DELIVERY_FROM };
  }

  /** sets the quantity of one product (adds it if it is not in the cart yet) */
  async set(customerId: number, productId: number, quantity: number) {
    const product = await this.products.findOne({ where: { id: productId, isActive: true }, relations: { inventory: true } });
    if (!product) throw new NotFoundException('This product is not available.');
    const stock = product.inventory?.quantityOnHand ?? 0;
    if (stock <= 0) throw new BadRequestException(`${product.name} is out of stock.`);
    if (quantity > stock) throw new BadRequestException(`Only ${stock} of ${product.name} left in stock.`);

    const cart = await this.cartOf(customerId);
    const row = await this.items.findOneBy({ cart: { id: cart.id }, product: { id: productId } });
    await this.items.save(row ? { ...row, quantity } : { cart, product, quantity });
    return this.get(customerId);
  }

  async remove(customerId: number, productId: number) {
    const cart = await this.cartOf(customerId);
    await this.items.delete({ cart: { id: cart.id }, product: { id: productId } });
    return this.get(customerId);
  }

  /** moves the guest cart from the browser into the account after login (REQ-LOG-3, REQ-CRT-5) */
  async merge(customerId: number, guestItems: { productId: number; quantity: number }[]) {
    const current = await this.get(customerId);
    for (const g of guestItems) {
      const have = current.items.find((l) => l.product.id === g.productId)?.quantity || 0;
      const product = await this.products.findOne({ where: { id: g.productId, isActive: true }, relations: { inventory: true } });
      const stock = product?.inventory?.quantityOnHand ?? 0;
      const quantity = Math.min(stock, have + g.quantity, 99);
      if (product && quantity > 0) await this.set(customerId, g.productId, quantity);
    }
    return this.get(customerId);
  }

  private async cartOf(customerId: number) {
    return (await this.carts.findOneBy({ customer: { id: customerId } })) ?? this.carts.save({ customer: { id: customerId } });
  }
}
