import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Staff, { nullable: true, onDelete: 'SET NULL' }) staff: Staff | null;
  @Column() action: string; // e.g. "Staff created", "Stock in"
  @Column() entityType: string; // staff, category, product, inventory, session
  @Column({ type: 'int', nullable: true }) entityId: number | null;
  @Column() description: string;
  @Index() @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
