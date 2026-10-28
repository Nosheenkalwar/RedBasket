import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { Staff } from './staff.entity';
import { Order } from './order.entity';

// return, damaged and lost come in later builds
export type MovementType = 'stock_in' | 'correction' | 'sale' | 'cancellation';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' }) product: Product;
  @ManyToOne(() => Staff, { nullable: true, onDelete: 'SET NULL' }) staff: Staff | null;
  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' }) order: Order | null;
  @Column() movementType: MovementType;
  @Column() quantityChange: number;
  @Column() quantityAfter: number;
  @Column({ default: '' }) note: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
