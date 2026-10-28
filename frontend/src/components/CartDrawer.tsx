import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBasket, Trash2, X } from 'lucide-react';
import { FREE_DELIVERY_FROM, rs } from '../lib/format';
import { useShop } from '../context/Shop';
import { useAuth } from '../context/Auth';
import { ProductImage, QtyStepper } from './ProductBits';

export default function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, setQty } = useShop();
  const { customer, openAuth } = useAuth();
  const nav = useNavigate();
  const close = () => setDrawerOpen(false);
  const checkout = () => {
    close();
    if (!customer) return openAuth('login'); // BR-6: guests must sign in to check out
    nav('/checkout');
  };
  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-noir/50 transition-opacity ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={close} />
      <aside className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-[440px] flex-col bg-cotton shadow-2xl transition-transform duration-300 ${drawerOpen ? '' : 'translate-x-full'}`} aria-label="Shopping cart" aria-hidden={!drawerOpen}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="display text-2xl">Your cart <span className="font-sans text-base text-ink-2">({cart.count})</span></h3>
          <button className="iconbtn" onClick={close} aria-label="Close cart"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-auto px-5 py-2">
          {cart.items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBasket size={48} className="mx-auto text-cherry" />
              <h3 className="display mb-1 mt-3 text-2xl">Your basket is empty</h3>
              <p className="text-ink-2">Start with today’s essentials: milk, bread, fruit.</p>
            </div>
          ) : cart.items.map(({ product: p, quantity, note }) => (
            <div key={p.id} className="grid grid-cols-[62px_1fr_auto] items-center gap-3 border-b border-line py-3">
              <Link to={`/p/${p.id}`} onClick={close} className="h-[62px] w-[62px] rounded-lg border border-line bg-white p-1 text-3xl"><ProductImage p={p} /></Link>
              <div className="min-w-0">
                <b className="block leading-tight">{p.name}</b>
                <small className="text-ink-2">{p.unit}, {rs(p.price)}</small>
                {note && <small className="block font-semibold text-warn">{note}</small>}
                <div className="mt-1.5 flex items-center gap-2"><QtyStepper product={p} size={15} light />
                  <button className="p-1 text-ink-3 hover:text-cherry" onClick={() => setQty(p, 0)} aria-label={`Remove ${p.name}`}><Trash2 size={16} /></button></div>
              </div>
              <b className="tabular-nums">{rs(p.price * quantity)}</b>
            </div>
          ))}
        </div>
        {cart.items.length > 0 && (
          <footer className="border-t border-line bg-card px-5 py-4">
            <Row label="Subtotal" value={rs(cart.subtotal)} />
            <Row label="Delivery" value={cart.subtotal >= FREE_DELIVERY_FROM ? 'Free' : 'From Rs. 149'} />
            <small className="text-ink-2">{cart.subtotal >= FREE_DELIVERY_FROM ? 'Your order ships free anywhere in Karachi.' : `Add ${rs(FREE_DELIVERY_FROM - cart.subtotal)} more for free delivery. Exact fee depends on your area.`}</small>
            <button className="btn mt-3 w-full py-3" onClick={checkout}>Go to checkout</button>
          </footer>
        )}
      </aside>
    </>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-1 text-[14.5px]"><span>{label}</span><span className="tabular-nums">{value}</span></div>
);
