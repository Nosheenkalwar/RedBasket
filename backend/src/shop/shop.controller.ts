import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AuthUser, CurrentUser, CustomerOnly } from '../common/auth';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';
import { CartItemDto, MergeCartDto } from './dto';

@Controller('cart')
@CustomerOnly()
export class CartController {
  constructor(private cart: CartService) {}

  @Get() get(@CurrentUser() u: AuthUser) { return this.cart.get(u.id); }
  @Put('items') set(@CurrentUser() u: AuthUser, @Body() dto: CartItemDto) { return this.cart.set(u.id, dto.productId, dto.quantity); }
  @Delete('items/:productId') remove(@CurrentUser() u: AuthUser, @Param('productId', ParseIntPipe) id: number) { return this.cart.remove(u.id, id); }
  @Post('merge') merge(@CurrentUser() u: AuthUser, @Body() dto: MergeCartDto) { return this.cart.merge(u.id, dto.items); }
}

@Controller('wishlist')
@CustomerOnly()
export class WishlistController {
  constructor(private wishlist: WishlistService) {}

  @Get() list(@CurrentUser() u: AuthUser) { return this.wishlist.list(u.id); }
  @Post(':productId') add(@CurrentUser() u: AuthUser, @Param('productId', ParseIntPipe) id: number) { return this.wishlist.add(u.id, id); }
  @Delete(':productId') remove(@CurrentUser() u: AuthUser, @Param('productId', ParseIntPipe) id: number) { return this.wishlist.remove(u.id, id); }
}
