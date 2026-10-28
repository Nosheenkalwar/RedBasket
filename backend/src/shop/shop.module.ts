import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart, CartItem } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { WishlistItem } from '../entities/wishlist.entity';
import { CartController, WishlistController } from './shop.controller';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product, WishlistItem])],
  controllers: [CartController, WishlistController],
  providers: [CartService, WishlistService],
})
export class ShopModule {}
