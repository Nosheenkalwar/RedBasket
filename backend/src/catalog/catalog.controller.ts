import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CatalogService, ProductQuery } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('categories') tree() { return this.catalog.tree(); }
  @Get('products') list(@Query() q: ProductQuery) { return this.catalog.list(q); }
  @Get('products/suggest') suggest(@Query('q') q: string) { return this.catalog.suggest(q); }
  @Get('products/:id') detail(@Param('id', ParseIntPipe) id: number) { return this.catalog.detail(id); }
}
