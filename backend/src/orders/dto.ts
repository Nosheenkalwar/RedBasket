import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ORDER_STATUSES, OrderStatus } from '../entities/order.entity';

export class QuoteDto {
  @IsInt({ message: 'Choose a delivery address.' }) addressId: number;
}

export class PlaceOrderDto extends QuoteDto {
  @IsString({ message: 'Choose a delivery slot.' }) deliverySlot: string;
  @IsIn(['cod', 'card_test'], { message: 'Choose a payment method.' }) paymentMethod: 'cod' | 'card_test';
  @IsOptional() @IsString() @MaxLength(200, { message: 'Notes can be up to 200 characters.' }) notes?: string;
}

export class StatusDto {
  @IsIn(ORDER_STATUSES, { message: 'Unknown status.' }) status: OrderStatus;
  @IsOptional() @IsString() @MaxLength(200) remarks?: string;
}
