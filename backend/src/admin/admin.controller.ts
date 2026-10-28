import {
  BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthUser, CurrentUser, StaffOnly } from '../common/auth';
import { ActivityService } from '../activity/activity.service';
import { StaffService } from './staff.service';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { InventoryService } from './inventory.service';
import { SummaryService } from './summary.service';
import { CategoryDto, CategoryUpdateDto, ProductDto, StaffDto, StockAdjustDto, StockInDto } from './dto';

type Q = Record<string, string>;

@Controller('admin')
export class AdminController {
  constructor(private summary: SummaryService) {}

  @Get('summary') @StaffOnly() get(@CurrentUser() u: AuthUser) { return this.summary.forRole(u.role!); }
}

@Controller('admin/staff')
@StaffOnly('SUPER_ADMIN')
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get() list(@Query() q: Q) { return this.staff.list(q); }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: StaffDto) { return this.staff.create(u, dto); }
  @Put(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: StaffDto) { return this.staff.update(u, id, dto); }
  @Post(':id/block') block(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.staff.setStatus(u, id, 'blocked'); }
  @Post(':id/unblock') unblock(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.staff.setStatus(u, id, 'active'); }
  @Post(':id/reset-password') reset(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.staff.resetPassword(u, id); }
}

@Controller('admin/activity')
@StaffOnly('SUPER_ADMIN')
export class ActivityController {
  constructor(private activity: ActivityService) {}

  @Get() list(@Query() q: Q) { return this.activity.list(q); }
}

@Controller('admin/categories')
@StaffOnly('SUB_ADMIN')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get() tree() { return this.categories.tree(); }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CategoryDto) { return this.categories.create(u, dto); }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CategoryUpdateDto) { return this.categories.update(u, id, dto); }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.categories.remove(u, id); }
}

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

@Controller('admin/products')
@StaffOnly('SUB_ADMIN')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get() list(@Query() q: Q) { return this.products.list(q); }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: ProductDto) { return this.products.create(u, dto); }
  @Put(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ProductDto) { return this.products.update(u, id, dto); }
  @Post(':id/hide') hide(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.products.setActive(u, id, false); }
  @Post(':id/show') show(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.products.setActive(u, id, true); }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.products.remove(u, id); }

  // JPG, PNG or WebP up to 2 MB (REQ-PRD-4, REQ-SEC-11)
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = IMAGE_TYPES.includes(extname(file.originalname).toLowerCase()) && /^image\/(jpeg|png|webp)$/.test(file.mimetype);
      cb(ok ? null : new BadRequestException('Use a JPG, PNG or WebP image.'), ok);
    },
    storage: diskStorage({
      destination: 'uploads',
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname).toLowerCase()}`),
    }),
  }))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image to upload.');
    return { url: `/uploads/${file.filename}` };
  }
}

@Controller('admin/inventory')
@StaffOnly('INVENTORY_STAFF')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get() list(@Query() q: Q) { return this.inventory.list(q); }
  @Get('movements') history(@Query() q: Q) { return this.inventory.history(q); }
  @Post('stock-in') stockIn(@CurrentUser() u: AuthUser, @Body() dto: StockInDto) { return this.inventory.stockIn(u, dto); }
  @Post('adjust') adjust(@CurrentUser() u: AuthUser, @Body() dto: StockAdjustDto) { return this.inventory.adjust(u, dto); }
}
