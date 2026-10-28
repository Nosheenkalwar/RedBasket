import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Order } from '../entities/order.entity';
import { Inventory } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import {
  ActivityController, AdminController, CategoriesController, InventoryController, ProductsController, StaffController,
} from './admin.controller';
import { CategoriesService } from './categories.service';
import { InventoryService } from './inventory.service';
import { ProductsService } from './products.service';
import { StaffService } from './staff.service';
import { SummaryService } from './summary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Inventory, StockMovement, Order])],
  controllers: [AdminController, StaffController, ActivityController, CategoriesController, ProductsController, InventoryController],
  providers: [StaffService, CategoriesService, ProductsService, InventoryService, SummaryService],
})
export class AdminModule {}
