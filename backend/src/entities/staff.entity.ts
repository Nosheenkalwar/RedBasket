import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const ROLES = ['SUPER_ADMIN', 'SUB_ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'] as const;
export type Role = (typeof ROLES)[number];

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn() id: number;
  @Column() fullName: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'enum', enum: ROLES }) role: Role;
  @Column({ default: 'active' }) status: 'active' | 'blocked';
  @Column({ default: true }) mustChangePassword: boolean;
  @Column({ default: 0 }) failedAttempts: number;
  @Column({ type: 'timestamptz', nullable: true }) lockedUntil: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
