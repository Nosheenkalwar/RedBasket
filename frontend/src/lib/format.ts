import { emojiForCategory } from './categoryLook';

export const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-US');

export const FREE_DELIVERY_FROM = 3000;

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Sub Admin', INVENTORY_STAFF: 'Inventory Staff', SALES_STAFF: 'Sales Staff',
};

export const STOCK_LABEL: Record<string, string> = { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' };

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });

/** picture shown until a real product photo is uploaded */
const EMOJI: Record<string, string> = {
  'Fruits & Vegetables': '🍎', 'Dairy & Eggs': '🥛', Bakery: '🥐', Beverages: '🧃', Snacks: '🍪', 'Cooking Essentials': '🍚',
  Cleaning: '🧼', Laundry: '🧺', Storage: '📦', 'Chargers & Cables': '🔌', Audio: '🎧', 'Power Banks': '🔋',
  Men: '👕', Women: '👗', Kids: '🧸', Toys: '🪀', Stationery: '✏️', Skincare: '🧴', 'Hair Care': '💆', Makeup: '💄',
};
// new sub-categories added by the admin get an emoji from their name
export const emojiFor = (subcategory?: string) => (subcategory && EMOJI[subcategory]) || emojiForCategory(subcategory);
