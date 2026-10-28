import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Brackets, DataSource, EntityManager, In, Repository } from 'typeorm';
import { CustomerAddress } from '../entities/address.entity';
import { Cart, CartItem } from '../entities/cart.entity';
import { Inventory } from '../entities/inventory.entity';
import { Order, OrderStatus, OrderStatusHistory, Payment } from '../entities/order.entity';
import { SalesHistory } from '../entities/sales-history.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../common/auth';
import { paging } from '../common/helpers';
import { deliverySlots, evaluateShipping } from '../shipping/shipping.rules';
import { PlaceOrderDto } from './dto';

// which status can follow which (BR-7: cancel only while placed or confirmed)
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};
export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

const DETAIL = { items: { product: true }, history: { changedBy: true }, payment: true, customer: true } as const;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(CustomerAddress) private addresses: Repository<CustomerAddress>,
    @InjectRepository(CartItem) private cartItems: Repository<CartItem>,
    private activity: ActivityService,
    private db: DataSource,
  ) {}

  /** delivery fee, rules and slots for the current cart and the chosen address */
  async quote(customerId: number, addressId: number) {
    const address = await this.address(customerId, addressId);
    const lines = await this.cartLines(this.db.manager, customerId);
    const subtotal = lines.reduce((a, l) => a + l.product.price * l.quantity, 0);
    const shipping = evaluateShipping({ city: address.city, area: address.area, subtotal, items: lines.map((l) => ({ unit: l.product.unit, quantity: l.quantity })) });
    return { subtotal, ...shipping, total: subtotal + shipping.fee, slots: deliverySlots() };
  }

  /** one transaction: check stock, create the order, take stock out, copy to sales history, empty the cart (REQ-DB-4) */
  async place(customerId: number, dto: PlaceOrderDto) {
    const address = await this.address(customerId, dto.addressId);
    if (!deliverySlots().includes(dto.deliverySlot)) throw new BadRequestException('That delivery slot is no longer available. Please pick another one.');

    const id = await this.db.transaction(async (tx) => {
      const lines = await this.cartLines(tx, customerId);
      if (!lines.length) throw new BadRequestException('Your cart is empty.');

      // lock the stock rows so two customers cannot buy the same last item
      const stock = await tx.getRepository(Inventory).createQueryBuilder('inv').innerJoinAndSelect('inv.product', 'p')
        .where('p.id IN (:...ids)', { ids: lines.map((l) => l.product.id) }).orderBy('p.id').setLock('pessimistic_write', undefined, ['inv']).getMany();
      for (const l of lines) {
        const inv = stock.find((s) => s.product.id === l.product.id)!;
        if (!l.product.isActive) throw new ConflictException(`${l.product.name} is no longer available. Please remove it from your cart.`);
        if (inv.quantityOnHand < l.quantity)
          throw new ConflictException(inv.quantityOnHand ? `Only ${inv.quantityOnHand} of ${l.product.name} left. Please update your cart.` : `${l.product.name} just sold out. Please remove it from your cart.`);
      }

      const subtotal = lines.reduce((a, l) => a + l.product.price * l.quantity, 0);
      const ship = evaluateShipping({ city: address.city, area: address.area, subtotal, items: lines.map((l) => ({ unit: l.product.unit, quantity: l.quantity })) });
      if (!ship.deliverable) throw new BadRequestException(ship.reason);
      const total = subtotal + ship.fee;
      const paid = dto.paymentMethod === 'card_test';

      const order = await tx.save(Order, {
        customer: { id: customerId }, status: 'placed',
        addressLabel: address.label, addressLine: address.addressLine, area: address.area, city: address.city,
        zone: ship.zone!, deliverySlot: dto.deliverySlot, courier: ship.courier, weightKg: ship.weightKg, shippingRules: ship.applied,
        notes: dto.notes?.trim() || '', subtotal, deliveryFee: ship.fee, total,
        items: lines.map((l) => ({ product: { id: l.product.id }, productName: l.product.name, unit: l.product.unit, unitPrice: l.product.price, quantity: l.quantity, lineTotal: l.product.price * l.quantity })),
        history: [{ status: 'placed', remarks: 'Order placed by customer' }],
        payment: { method: dto.paymentMethod, amount: total, status: paid ? 'paid' : 'pending', paidAt: paid ? new Date() : null, transactionRef: paid ? 'TEST-' + randomBytes(4).toString('hex').toUpperCase() : null } as Payment,
      });
      await tx.update(Order, order.id, { orderNumber: `RB-${10000 + order.id}` });

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      for (const l of lines) {
        const inv = stock.find((s) => s.product.id === l.product.id)!;
        const after = inv.quantityOnHand - l.quantity;
        await tx.update(Inventory, inv.id, { quantityOnHand: after });
        await tx.save(StockMovement, { product: { id: l.product.id }, order: { id: order.id }, movementType: 'sale', quantityChange: -l.quantity, quantityAfter: after, note: `Order RB-${10000 + order.id}` });
        await tx.save(SalesHistory, { product: { id: l.product.id }, salesDate: today, unitsSold: l.quantity, unitPrice: l.product.price });
      }
      await tx.delete(CartItem, { id: In(lines.map((l) => l.id)) });
      return order.id;
    });
    return this.view(await this.find(id));
  }

  async mine(customerId: number) {
    const list = await this.orders.find({ where: { customer: { id: customerId } }, relations: { items: { product: true }, payment: true }, order: { placedAt: 'DESC' } });
    return list.map((o) => this.view(o));
  }

  async mineOne(customerId: number, orderNumber: string) {
    const o = await this.orders.findOne({ where: { orderNumber, customer: { id: customerId } }, relations: DETAIL });
    if (!o) throw new NotFoundException('Order not found.');
    return this.view(o);
  }

  async cancelByCustomer(customerId: number, orderNumber: string) {
    const o = await this.orders.findOne({ where: { orderNumber, customer: { id: customerId } } });
    if (!o) throw new NotFoundException('Order not found.');
    await this.changeStatus(o.id, 'cancelled', null, 'Cancelled by customer');
    return this.mineOne(customerId, orderNumber);
  }

  // ---------- staff side ----------

  async list(query: { status?: string; q?: string; page?: string }) {
    const { page, pageSize, skip, take } = paging(query);
    const qb = this.orders.createQueryBuilder('o').leftJoinAndSelect('o.customer', 'c').leftJoinAndSelect('o.payment', 'pay')
      .loadRelationCountAndMap('o.itemCount', 'o.items').orderBy('o.placedAt', 'DESC').skip(skip).take(take);
    if (query.status) qb.andWhere('o.status = :s', { s: query.status });
    const q = query.q?.trim();
    if (q) qb.andWhere(new Brackets((w) => w.where('o.orderNumber ILIKE :q', { q: `%${q}%` })
      .orWhere("CONCAT(c.firstName, ' ', c.lastName) ILIKE :q", { q: `%${q}%` }).orWhere('c.phoneNumber ILIKE :ph', { ph: `%${q.replace(/\D/g, '').replace(/^0/, '') || q}%` })));
    const [items, total] = await qb.getManyAndCount();
    const counts = await this.orders.createQueryBuilder('o').select('o.status', 'status').addSelect('COUNT(*)', 'n').groupBy('o.status').getRawMany();
    return { items: items.map((o) => this.view(o)), total, page, pageSize, counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])) };
  }

  async detail(id: number) {
    return this.view(await this.find(id));
  }

  async updateByStaff(me: AuthUser, id: number, status: OrderStatus, remarks = '') {
    const o = await this.changeStatus(id, status, me.id, remarks);
    await this.activity.log(me.id, 'Order status changed', 'order', id, `${o.orderNumber} is now ${STATUS_LABEL[status]}`);
    return this.detail(id);
  }

  private async changeStatus(id: number, status: OrderStatus, staffId: number | null, remarks: string) {
    return this.db.transaction(async (tx) => {
      const o = await tx.findOne(Order, { where: { id }, relations: { items: { product: true }, payment: true }, lock: { mode: 'pessimistic_write', tables: ['orders'] } });
      if (!o) throw new NotFoundException('Order not found.');
      if (!NEXT[o.status].includes(status))
        throw new BadRequestException(status === 'cancelled' ? 'This order is already packed, so it cannot be cancelled.' : `An order that is ${STATUS_LABEL[o.status].toLowerCase()} cannot move to ${STATUS_LABEL[status].toLowerCase()}.`);

      if (status === 'cancelled') await this.restock(tx, o);
      if (status === 'delivered' && o.payment.method === 'cod') await tx.update(Payment, o.payment.id, { status: 'paid', paidAt: new Date() });
      if (status === 'cancelled' && o.payment.status === 'paid') await tx.update(Payment, o.payment.id, { status: 'refunded' });

      await tx.update(Order, id, { status });
      await tx.save(OrderStatusHistory, { order: { id }, status, changedBy: staffId ? { id: staffId } : null, remarks });
      return o;
    });
  }

  private async restock(tx: EntityManager, o: Order) {
    for (const item of o.items) {
      const inv = await tx.findOneOrFail(Inventory, { where: { product: { id: item.product.id } }, lock: { mode: 'pessimistic_write' } });
      const after = inv.quantityOnHand + item.quantity;
      await tx.update(Inventory, inv.id, { quantityOnHand: after });
      await tx.save(StockMovement, { product: { id: item.product.id }, order: { id: o.id }, movementType: 'cancellation', quantityChange: item.quantity, quantityAfter: after, note: `${o.orderNumber} cancelled` });
    }
  }

  private async cartLines(m: EntityManager, customerId: number) {
    const cart = await m.findOne(Cart, { where: { customer: { id: customerId } } });
    if (!cart) return [];
    return m.find(CartItem, { where: { cart: { id: cart.id } }, relations: { product: true }, order: { id: 'ASC' } });
  }

  private async address(customerId: number, id: number) {
    const a = await this.addresses.findOneBy({ id, customer: { id: customerId } });
    if (!a) throw new NotFoundException('Choose one of your saved addresses.');
    return a;
  }

  private async find(id: number) {
    const o = await this.orders.findOne({ where: { id }, relations: DETAIL, order: { history: { changedAt: 'ASC' } } });
    if (!o) throw new NotFoundException('Order not found.');
    return o;
  }

  private view(o: Order & { itemCount?: number }) {
    return {
      id: o.id, orderNumber: o.orderNumber, status: o.status, statusLabel: STATUS_LABEL[o.status], next: NEXT[o.status],
      placedAt: o.placedAt, deliverySlot: o.deliverySlot, courier: o.courier, weightKg: o.weightKg, shippingRules: o.shippingRules, notes: o.notes,
      address: { label: o.addressLabel, addressLine: o.addressLine, area: o.area, city: o.city, zone: o.zone },
      subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total,
      itemCount: o.itemCount ?? o.items?.reduce((a, i) => a + i.quantity, 0),
      customer: o.customer && { id: o.customer.id, name: `${o.customer.firstName} ${o.customer.lastName}`, phoneNumber: o.customer.phoneNumber },
      payment: o.payment && { method: o.payment.method, status: o.payment.status, transactionRef: o.payment.transactionRef },
      items: o.items?.map((i) => ({ productId: i.product?.id, name: i.productName, unit: i.unit, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal, imageUrl: i.product?.imageUrl ?? null })),
      history: o.history?.map((h) => ({ status: h.status, label: STATUS_LABEL[h.status], remarks: h.remarks, at: h.changedAt, by: h.changedBy?.fullName ?? null })),
    };
  }
}
