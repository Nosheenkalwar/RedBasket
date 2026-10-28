import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CustomerAddress } from '../entities/address.entity';
import { Customer } from '../entities/customer.entity';
import { AddressDto, UpdateProfileDto } from './dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Customer) private customers: Repository<Customer>,
    @InjectRepository(CustomerAddress) private addresses: Repository<CustomerAddress>,
    private db: DataSource,
  ) {}

  profile(id: number) {
    return this.customers.findOneByOrFail({ id });
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    await this.customers.update(id, { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email: dto.email?.trim().toLowerCase() || null });
    return this.profile(id);
  }

  listAddresses(customerId: number) {
    return this.addresses.find({ where: { customer: { id: customerId } }, order: { isDefault: 'DESC', id: 'ASC' } });
  }

  async addAddress(customerId: number, dto: AddressDto) {
    const count = await this.addresses.countBy({ customer: { id: customerId } });
    const saved = await this.addresses.save({ ...dto, customer: { id: customerId }, isDefault: false });
    // the first address is the default one
    if (dto.isDefault || count === 0) await this.makeDefault(customerId, saved.id);
    return this.listAddresses(customerId);
  }

  async updateAddress(customerId: number, id: number, dto: AddressDto) {
    await this.own(customerId, id);
    const { isDefault, ...fields } = dto;
    await this.addresses.update(id, fields);
    if (isDefault) await this.makeDefault(customerId, id);
    return this.listAddresses(customerId);
  }

  async removeAddress(customerId: number, id: number) {
    const address = await this.own(customerId, id);
    await this.addresses.delete(id);
    if (address.isDefault) {
      const next = await this.addresses.findOne({ where: { customer: { id: customerId } }, order: { id: 'ASC' } });
      if (next) await this.addresses.update(next.id, { isDefault: true });
    }
    return this.listAddresses(customerId);
  }

  async makeDefault(customerId: number, id: number) {
    await this.own(customerId, id);
    await this.db.transaction(async (tx) => {
      await tx.update(CustomerAddress, { customer: { id: customerId } }, { isDefault: false });
      await tx.update(CustomerAddress, id, { isDefault: true });
    });
    return this.listAddresses(customerId);
  }

  // a customer can only touch their own addresses (REQ-SEC-6)
  private async own(customerId: number, id: number) {
    const a = await this.addresses.findOneBy({ id, customer: { id: customerId } });
    if (!a) throw new NotFoundException('Address not found.');
    return a;
  }
}
