import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAddress } from '../entities/address.entity';
import { CartItem } from '../entities/cart.entity';
import { Order } from '../entities/order.entity';
import { ShippingController } from '../shipping/shipping.controller';
import { AdminOrdersController, CheckoutController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, CustomerAddress, CartItem])],
  controllers: [CheckoutController, AdminOrdersController, ShippingController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
