import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('otp_verifications')
export class OtpVerification {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column() phoneNumber: string;
  @Column() purpose: 'signup' | 'login';
  @Column() otpHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ default: 0 }) attemptCount: number;
  @Column({ default: false }) isUsed: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
