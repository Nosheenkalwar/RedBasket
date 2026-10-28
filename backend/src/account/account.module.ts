import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAddress } from '../entities/address.entity';
import { Customer } from '../entities/customer.entity';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, CustomerAddress])],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
