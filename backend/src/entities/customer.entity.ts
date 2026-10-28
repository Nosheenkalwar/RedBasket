import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CustomerAddress } from './address.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn() id: number;
  @Column() firstName: string;
  @Column() lastName: string;
  @Column({ unique: true }) phoneNumber: string; // stored as +923001234567
  @Column({ type: 'varchar', nullable: true }) email: string | null;
  @Column({ default: true }) isPhoneVerified: boolean;
  @Column({ default: 'active' }) status: 'active' | 'blocked';
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @OneToMany(() => CustomerAddress, (a) => a.customer) addresses: CustomerAddress[];
}
