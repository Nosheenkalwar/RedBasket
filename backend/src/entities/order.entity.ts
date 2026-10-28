import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';
import { Staff } from './staff.entity';
import { money } from './columns';

export const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ type: 'varchar', nullable: true }) orderNumber: string | null;
  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' }) customer: Customer;
  @Index() @Column({ type: 'enum', enum: ORDER_STATUSES, default: 'placed' }) status: OrderStatus;

  // the address is copied into the order, so editing an address later does not change old orders
  @Column() addressLabel: string;
  @Column() addressLine: string;
  @Column() area: string;
  @Column() city: string;
  @Column() zone: string;
  @Column() deliverySlot: string;
  @Column() courier: string;
  @Column({ ...money, precision: 6, scale: 1 }) weightKg: number;
  @Column({ type: 'jsonb', default: [] }) shippingRules: string[];
  @Column({ default: '' }) notes: string;

  @Column(money) subtotal: number;
  @Column(money) deliveryFee: number;
  @Column(money) total: number;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true }) items: Relation<OrderItem>[];
  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true }) history: Relation<OrderStatusHistory>[];
  @OneToOne(() => Payment, (p) => p.order, { cascade: true }) payment: Relation<Payment>;
  @Index() @CreateDateColumn({ type: 'timestamptz' }) placedAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' }) order: Relation<Order>;
  @ManyToOne(() => Product, { onDelete: 'RESTRICT' }) product: Product;
  @Column() productName: string; // price and name at the time of the order (BR-11)
  @Column() unit: string;
  @Column(money) unitPrice: number;
  @Column() quantity: number;
  @Column(money) lineTotal: number;
}

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Order, (o) => o.history, { onDelete: 'CASCADE' }) order: Relation<Order>;
  @Column({ type: 'enum', enum: ORDER_STATUSES }) status: OrderStatus;
  @ManyToOne(() => Staff, { nullable: true, onDelete: 'SET NULL' }) changedBy: Staff | null;
  @Column({ default: '' }) remarks: string;
  @CreateDateColumn({ type: 'timestamptz' }) changedAt: Date;
}

// payments are simulated (test checkout), card numbers are never stored (REQ-DB-7)
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn() id: number;
  @OneToOne(() => Order, (o) => o.payment, { onDelete: 'CASCADE' }) @JoinColumn() order: Relation<Order>;
  @Column() method: 'cod' | 'card_test';
  @Column(money) amount: number;
  @Column({ default: 'pending' }) status: 'pending' | 'paid' | 'refunded';
  @Column({ type: 'varchar', nullable: true }) transactionRef: string | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
