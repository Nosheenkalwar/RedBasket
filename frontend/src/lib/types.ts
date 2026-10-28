export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type ProductCard = {
  id: number; name: string; brand: string; unit: string; price: number; imageUrl: string | null;
  stock: number; stockStatus: StockStatus;
  subcategory: { id: number; name: string }; category: { id: number; name: string } | null;
};

export type ProductDetail = ProductCard & { description: string; sku: string; related: ProductCard[] };

export type CategoryNode = { id: number; name: string; productCount: number; subcategories: { id: number; name: string; productCount: number }[] };

export type Customer = { id: number; firstName: string; lastName: string; phoneNumber: string; email: string | null };

export type Address = { id: number; label: string; addressLine: string; area: string; city: string; isDefault: boolean };

export type CartLine = { product: ProductCard; quantity: number; lineTotal: number; note: string | null };
export type Cart = { items: CartLine[]; count: number; subtotal: number };

export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type Order = {
  id: number; orderNumber: string; status: OrderStatus; statusLabel: string; next: OrderStatus[]; placedAt: string;
  deliverySlot: string; courier: string; weightKg: number; shippingRules: string[]; notes: string;
  address: { label: string; addressLine: string; area: string; city: string; zone: string };
  subtotal: number; deliveryFee: number; total: number; itemCount: number;
  customer?: { id: number; name: string; phoneNumber: string };
  payment: { method: 'cod' | 'card_test'; status: 'pending' | 'paid' | 'refunded'; transactionRef: string | null };
  items?: { productId: number; name: string; unit: string; unitPrice: number; quantity: number; lineTotal: number; imageUrl: string | null }[];
  history?: { status: OrderStatus; label: string; remarks: string; at: string; by: string | null }[];
};

export type Area = { name: string; zone: string; zoneName: string; fee: number };

export type Role = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'INVENTORY_STAFF' | 'SALES_STAFF';
export type StaffUser = { id: number; fullName: string; email: string; phone: string | null; role: Role; mustChangePassword: boolean };

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
