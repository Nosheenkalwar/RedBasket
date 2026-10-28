import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser, CustomerOnly, StaffOnly } from '../common/auth';
import { OrdersService } from './orders.service';
import { PlaceOrderDto, QuoteDto, StatusDto } from './dto';

@Controller()
@CustomerOnly()
export class CheckoutController {
  constructor(private orders: OrdersService) {}

  @Post('checkout/quote') quote(@CurrentUser() u: AuthUser, @Body() dto: QuoteDto) { return this.orders.quote(u.id, dto.addressId); }
  @Post('orders') place(@CurrentUser() u: AuthUser, @Body() dto: PlaceOrderDto) { return this.orders.place(u.id, dto); }
  @Get('orders') mine(@CurrentUser() u: AuthUser) { return this.orders.mine(u.id); }
  @Get('orders/:number') one(@CurrentUser() u: AuthUser, @Param('number') n: string) { return this.orders.mineOne(u.id, n); }
  @Post('orders/:number/cancel') cancel(@CurrentUser() u: AuthUser, @Param('number') n: string) { return this.orders.cancelByCustomer(u.id, n); }
}

@Controller('admin/orders')
@StaffOnly('SALES_STAFF', 'SUB_ADMIN')
export class AdminOrdersController {
  constructor(private orders: OrdersService) {}

  @Get() list(@Query() q: Record<string, string>) { return this.orders.list(q); }
  @Get(':id') detail(@Param('id', ParseIntPipe) id: number) { return this.orders.detail(id); }
  @Post(':id/status') status(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: StatusDto) {
    return this.orders.updateByStaff(u, id, dto.status, dto.remarks);
  }
}
