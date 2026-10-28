import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { Inventory } from './inventory.entity';
import { money } from './columns';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' }) category: Category; // always a sub-category
  @Column({ unique: true }) sku: string;
  @Column() name: string;
  @Column() brand: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column() unit: string;
  @Column(money) price: number;
  @Column({ ...money, nullable: true }) costPrice: number | null;
  @Column({ default: 3 }) leadTimeDays: number;
  @Column({ type: 'varchar', nullable: true }) imageUrl: string | null;
  @Column({ default: true }) isActive: boolean;
  @OneToOne(() => Inventory, (i) => i.product, { cascade: true }) inventory: Inventory;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
