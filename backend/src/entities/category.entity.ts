import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// one table for both: a category has parent = null, a sub-category points to its category
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @ManyToOne(() => Category, (c) => c.children, { nullable: true, onDelete: 'RESTRICT' }) parent: Category | null;
  @OneToMany(() => Category, (c) => c.parent) children: Category[];
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
