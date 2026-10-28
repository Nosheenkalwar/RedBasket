import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Cart, CartLine, ProductCard } from '../lib/types';
import { useAuth } from './Auth';
import { useToast } from './Toast';

// Guests keep their cart in the browser. After login it is merged into the account cart (REQ-CRT-5).
const GUEST_KEY = 'rb_guest_cart';
const EMPTY: Cart = { items: [], count: 0, subtotal: 0 };

const loadGuest = (): CartLine[] => JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
// delivery is priced at checkout from the address (see the shipping rules on the backend)
const totals = (items: CartLine[]): Cart => ({
  items, count: items.reduce((a, l) => a + l.quantity, 0), subtotal: items.reduce((a, l) => a + l.product.price * l.quantity, 0),
});

type Ctx = {
  cart: Cart;
  qtyOf: (productId: number) => number;
  setQty: (product: ProductCard, quantity: number) => Promise<void>;
  wishlist: ProductCard[];
  isWished: (productId: number) => boolean;
  toggleWish: (product: ProductCard) => Promise<void>;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  reloadCart: () => Promise<void>;
};

const ShopCtx = createContext<Ctx>(null!);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { customer, ready, openAuth } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState<Cart>(() => totals(loadGuest()));
  const [wishlist, setWishlist] = useState<ProductCard[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // when the customer logs in: merge the guest cart, then load cart and wishlist from the server
  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      setCart(totals(loadGuest()));
      setWishlist([]);
      return;
    }
    const guest = loadGuest();
    const cartReq = guest.length
      ? api<Cart>('/cart/merge', { method: 'POST', body: { items: guest.map((l) => ({ productId: l.product.id, quantity: l.quantity })) } })
      : api<Cart>('/cart');
    cartReq.then((c) => {
      localStorage.removeItem(GUEST_KEY);
      setCart(c);
    }).catch(() => setCart(EMPTY));
    api<ProductCard[]>('/wishlist').then(setWishlist).catch(() => setWishlist([]));
  }, [customer, ready]);

  const qtyOf = useCallback((id: number) => cart.items.find((l) => l.product.id === id)?.quantity || 0, [cart]);

  const setQty = async (product: ProductCard, quantity: number) => {
    if (quantity > product.stock) return toast(`Only ${product.stock} of ${product.name} left in stock.`, true);
    try {
      if (customer) {
        setCart(quantity > 0
          ? await api<Cart>('/cart/items', { method: 'PUT', body: { productId: product.id, quantity } })
          : await api<Cart>(`/cart/items/${product.id}`, { method: 'DELETE' }));
      } else {
        const rest = loadGuest().filter((l) => l.product.id !== product.id);
        const next = quantity > 0 ? [...rest, { product, quantity, lineTotal: product.price * quantity, note: null }] : rest;
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        setCart(totals(next));
      }
      if (quantity > 0 && qtyOf(product.id) === 0) toast(`${product.name} added to cart`);
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  const reloadCart = async () => {
    if (customer) setCart(await api<Cart>('/cart'));
  };

  const isWished = (id: number) => wishlist.some((p) => p.id === id);
  const toggleWish = async (product: ProductCard) => {
    if (!customer) {
      toast('Please sign in to use your wishlist.');
      return openAuth('login');
    }
    const on = isWished(product.id);
    try {
      setWishlist(await api<ProductCard[]>(`/wishlist/${product.id}`, { method: on ? 'DELETE' : 'POST' }));
      toast(on ? 'Removed from wishlist' : 'Saved to your wishlist');
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <ShopCtx.Provider value={{ cart, qtyOf, setQty, wishlist, isWished, toggleWish, drawerOpen, setDrawerOpen, reloadCart }}>
      {children}
    </ShopCtx.Provider>
  );
}

export const useShop = () => useContext(ShopCtx);
