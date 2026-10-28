import { stockStatus } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';

/** the shape the shop pages use for a product card. Needs category.parent and inventory loaded. */
export const productCard = (p: Product) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  unit: p.unit,
  price: p.price,
  imageUrl: p.imageUrl,
  stock: p.inventory?.quantityOnHand ?? 0,
  stockStatus: stockStatus(p.inventory?.quantityOnHand ?? 0, p.inventory?.reorderPoint ?? 10),
  subcategory: { id: p.category.id, name: p.category.name },
  category: p.category.parent ? { id: p.category.parent.id, name: p.category.parent.name } : null,
});

export const PRODUCT_RELATIONS = { category: { parent: true }, inventory: true } as const;
