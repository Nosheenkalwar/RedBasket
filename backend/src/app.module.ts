import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbOptions } from './database/data-source';
import { CommonModule } from './common/common.module';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { CatalogModule } from './catalog/catalog.module';
import { ShopModule } from './shop/shop.module';
import { AdminModule } from './admin/admin.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: dbOptions }),
    CommonModule,
    ActivityModule,
    AuthModule,
    AccountModule,
    CatalogModule,
    ShopModule,
    AdminModule,
    OrdersModule,
  ],
})
export class AppModule {}
