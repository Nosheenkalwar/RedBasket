import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn() id: number;
  @OneToOne(() => Customer, { onDelete: 'CASCADE' }) @JoinColumn() customer: Customer;
  @OneToMany(() => CartItem, (i) => i.cart) items: CartItem[];
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('cart_items')
@Unique(['cart', 'product'])
export class CartItem {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE' }) cart: Cart;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' }) product: Product;
  @Column() quantity: number;
}
