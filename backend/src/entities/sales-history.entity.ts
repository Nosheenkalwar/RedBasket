import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { money } from './columns';

// every sale is copied here so the forecasting engine (FYP-II) can learn from it (REQ-DB-8)
@Entity('sales_history')
export class SalesHistory {
  @PrimaryGeneratedColumn() id: number;
  @Index() @ManyToOne(() => Product, { onDelete: 'CASCADE' }) product: Product;
  @Index() @Column({ type: 'date' }) salesDate: string;
  @Column() unitsSold: number;
  @Column(money) unitPrice: number;
  @Column({ default: 'store' }) dataSource: 'store' | 'import';
}
