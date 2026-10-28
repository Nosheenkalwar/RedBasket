import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_addresses')
export class CustomerAddress {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Customer, (c) => c.addresses, { onDelete: 'CASCADE' }) customer: Customer;
  @Column() label: string;
  @Column() addressLine: string;
  @Column() area: string;
  @Column({ default: 'Karachi' }) city: string;
  @Column({ default: false }) isDefault: boolean;
}
