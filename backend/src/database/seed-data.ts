// [name, brand, unit, price, stock]
type Row = [string, string, string, number, number];

export const CATALOG: Record<string, Record<string, Row[]>> = {
  Groceries: {
    'Fruits & Vegetables': [
      ['Bananas', 'Farm Fresh', '12 pcs', 190, 110], ['Apples (Kala Kulu)', 'Farm Fresh', '1 kg', 360, 120],
      ['Tomatoes', 'Farm Fresh', '1 kg', 140, 140], ['Potatoes', 'Farm Fresh', '1 kg', 90, 8],
    ],
    'Dairy & Eggs': [
      ['Fresh Milk', 'Nestlé', '1 litre', 290, 34], ['Farm Eggs', 'Desi Farms', '12 pcs', 420, 52],
      ['Cheddar Cheese', 'Adams', '200 g', 890, 6], ['Greek Yogurt', 'Nurpur', '500 g', 380, 90],
    ],
    Bakery: [
      ['Sourdough Loaf', 'Bread & Beyond', 'each', 450, 16], ['Whole Wheat Bread', 'Dawn', 'each', 220, 120],
      ['Butter Croissant', 'Bread & Beyond', 'each', 240, 0],
    ],
    Beverages: [
      ['Orange Juice', 'Nestlé', '1 litre', 420, 110], ['Green Tea', 'Tapal', '25 bags', 560, 66],
      ['Mineral Water', 'Aquafina', '1.5 litre', 90, 420],
    ],
    Snacks: [
      ['Salted Crisps', 'Lays', '70 g', 120, 200], ['Chocolate Cookies', 'Peek Freans', 'pack of 6', 380, 75],
      ['Mixed Nuts', 'Nutty Co.', '500 g', 1640, 9],
    ],
    'Cooking Essentials': [
      ['Basmati Rice', 'Guard', '5 kg', 2150, 140], ['Cooking Oil', 'Dalda', '3 litre', 1380, 95],
      ['Iodised Salt', 'National', '800 g', 70, 300], ['Natural Honey', 'Langnese', '500 g', 980, 60],
    ],
  },
  Household: {
    Cleaning: [['Dish Soap', 'Max', '750 ml', 330, 72], ['Floor Cleaner', 'Harpic', '1 litre', 520, 40]],
    Laundry: [['Laundry Detergent', 'Ariel', '3 kg', 1150, 70], ['Fabric Softener', 'Comfort', '1 litre', 640, 5]],
    Storage: [['Garbage Bags', 'Glad', '30 pcs', 360, 65], ['Food Containers', 'Lion Star', 'set of 3', 990, 30]],
  },
  Electronics: {
    'Chargers & Cables': [['USB-C Cable', 'Anker', '1 m', 650, 120], ['20W Wall Charger', 'Baseus', 'each', 2450, 25]],
    Audio: [['Wireless Earbuds', 'Audionic', 'each', 4999, 90], ['Bluetooth Speaker', 'JBL', 'each', 8999, 7]],
    'Power Banks': [['Power Bank 10,000 mAh', 'Anker', 'each', 3200, 80], ['Power Bank 20,000 mAh', 'Baseus', 'each', 5400, 0]],
  },
  Clothing: {
    Men: [['Cotton T-Shirt', 'Outfitters', 'each', 1450, 50], ['Zip Hoodie', 'Outfitters', 'each', 3490, 44]],
    Women: [['Lawn Kurta', 'Khaadi', 'each', 2990, 35], ['Cotton Dupatta', 'Khaadi', 'each', 1290, 60]],
    Kids: [['Kids Pyjama Set', 'Minnie Minors', 'each', 1650, 40], ['Ankle Socks', 'Minnie Minors', 'pack of 3', 690, 70]],
  },
  'Toys & Kids': {
    Toys: [['Building Blocks', 'Lego', '120 pcs', 4500, 18], ['Soft Teddy Bear', 'Toy Town', 'each', 1800, 25]],
    Stationery: [['Colour Pencils', 'Faber-Castell', 'pack of 24', 650, 90], ['Ruled Notebook', 'Paper One', 'pack of 3', 450, 120]],
  },
  Beauty: {
    Skincare: [['Face Wash', 'Garnier', '100 ml', 690, 80], ['Sunscreen SPF 50', 'Neutrogena', '88 ml', 2650, 12]],
    'Hair Care': [['Anti-dandruff Shampoo', 'Head & Shoulders', '360 ml', 1150, 70], ['Coconut Hair Oil', 'Parachute', '200 ml', 420, 100]],
    Makeup: [['Lipstick', 'Maybelline', 'each', 1890, 30], ['Kajal', 'Lakmé', 'each', 650, 4]],
  },
};

export const STAFF = [
  { fullName: 'Ayesha Ghayas', email: 'admin@redbasket.pk', role: 'SUPER_ADMIN' },
  { fullName: 'Hassan Raza', email: 'subadmin@redbasket.pk', role: 'SUB_ADMIN' },
  { fullName: 'Rida Fatima', email: 'inventory@redbasket.pk', role: 'INVENTORY_STAFF' },
  { fullName: 'Imran Shah', email: 'sales@redbasket.pk', role: 'SALES_STAFF' },
] as const;
