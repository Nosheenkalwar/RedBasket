import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';

@Entity('wishlist')
@Unique(['customer', 'product'])
export class WishlistItem {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' }) customer: Customer;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' }) product: Product;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
