import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { dbOptions } from './data-source';
import { CATALOG, STAFF } from './seed-data';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Staff } from '../entities/staff.entity';

// Loads the categories, sample products and one account per staff role.
// Safe to run again: it skips anything that already exists.
async function seed() {
  const db = await new DataSource({ ...dbOptions(), synchronize: true }).initialize();
  const staffRepo = db.getRepository(Staff);
  const catRepo = db.getRepository(Category);
  const productRepo = db.getRepository(Product);

  const passwordHash = await bcrypt.hash('RedBasket@123', 10);
  for (const s of STAFF) {
    if (await staffRepo.findOneBy({ email: s.email })) continue;
    // the seeded accounts can log in straight away; new staff get a temporary password
    await staffRepo.save({ ...s, passwordHash, mustChangePassword: false });
  }

  let sku = 1000;
  for (const [catName, subs] of Object.entries(CATALOG)) {
    const cat = (await catRepo.findOne({ where: { name: catName, parent: IsNull() } }))
      ?? (await catRepo.save({ name: catName, parent: null }));
    for (const [subName, rows] of Object.entries(subs)) {
      const sub = (await catRepo.findOne({ where: { name: subName, parent: { id: cat.id } } }))
        ?? (await catRepo.save({ name: subName, parent: cat }));
      for (const [name, brand, unit, price, stock] of rows) {
        sku++;
        if (await productRepo.findOneBy({ name })) continue;
        await productRepo.save({
          name, brand, unit, price, sku: 'RB-' + sku, category: sub,
          costPrice: Math.round(price * 0.78),
          description: `${name} by ${brand}. Checked at our warehouse before it is packed for you.`,
          inventory: { quantityOnHand: stock, reorderPoint: 10 },
        });
      }
    }
  }
  console.log('Seed finished. Staff password for every seeded account: RedBasket@123');
  await db.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
