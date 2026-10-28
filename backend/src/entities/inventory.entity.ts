import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn() id: number;
  @OneToOne(() => Product, (p) => p.inventory, { onDelete: 'CASCADE' }) @JoinColumn() product: Product;
  @Column({ default: 0 }) quantityOnHand: number;
  @Column({ default: 10 }) reorderPoint: number; // "Low stock" when quantity is at or below this
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

export const stockStatus = (qty: number, reorderPoint: number) =>
  qty <= 0 ? 'out_of_stock' : qty <= reorderPoint ? 'low_stock' : 'in_stock';
