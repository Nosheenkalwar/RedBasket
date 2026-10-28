import { Link } from 'react-router-dom';
import { Heart, Minus, Plus } from 'lucide-react';
import { emojiFor, rs, STOCK_LABEL } from '../lib/format';
import type { ProductCard as P } from '../lib/types';
import { useShop } from '../context/Shop';

export function ProductImage({ p, className = '' }: { p: Pick<P, 'imageUrl' | 'name' | 'subcategory'>; className?: string }) {
  return p.imageUrl
    ? <img src={p.imageUrl} alt={p.name} loading="lazy" className={`h-full w-full object-contain ${className}`} />
    : <span className={`grid h-full w-full place-items-center ${className}`} aria-hidden="true">{emojiFor(p.subcategory?.name)}</span>;
}

export function StockPill({ status, stock }: { status: P['stockStatus']; stock: number }) {
  if (status === 'in_stock') return null;
  return <span className={`pill ${status === 'out_of_stock' ? 'bg-noir text-cotton' : 'bg-warn-soft text-warn'}`}>{status === 'low_stock' ? `Only ${stock} left` : STOCK_LABEL[status]}</span>;
}

export function QtyStepper({ product, size = 16, light }: { product: P; size?: number; light?: boolean }) {
  const { qtyOf, setQty } = useShop();
  const q = qtyOf(product.id);
  return (
    <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${light ? 'bg-tint text-noir' : 'bg-cherry text-cotton'}`}>
      <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/10" onClick={() => setQty(product, q - 1)} aria-label="Remove one"><Minus size={size} /></button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums">{q}</span>
      <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/10 disabled:opacity-40" disabled={q >= product.stock}
        onClick={() => setQty(product, q + 1)} aria-label="Add one"><Plus size={size} /></button>
    </div>
  );
}

export function ProductCard({ p }: { p: P }) {
  const { qtyOf, setQty, isWished, toggleWish } = useShop();
  const wished = isWished(p.id);
  const out = p.stockStatus === 'out_of_stock';
  return (
    <article className="relative flex min-w-0 flex-col gap-1.5 rounded-xl border-[1.5px] border-line bg-card p-3 transition hover:border-noir">
      <button className={`absolute right-5 top-5 z-[1] grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow transition hover:scale-110 ${wished ? 'text-cherry' : 'text-ink-2'}`}
        onClick={() => toggleWish(p)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished}>
        <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
      </button>
      <div className="absolute left-5 top-5 z-[1]"><StockPill status={p.stockStatus} stock={p.stock} /></div>
      <Link to={`/p/${p.id}`} className="group block aspect-square overflow-hidden rounded-lg border border-line bg-white p-3 text-5xl">
        <ProductImage p={p} className="transition duration-300 group-hover:scale-105" />
      </Link>
      <span className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.06em] text-cherry">{p.brand}</span>
      <Link to={`/p/${p.id}`} className="-mt-1 font-semibold leading-tight hover:text-cherry">{p.name}</Link>
      <span className="text-[12.5px] text-ink-2">{p.subcategory.name}, {p.unit}</span>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <b className="tabular-nums">{rs(p.price)}</b>
        {qtyOf(p.id) > 0 ? <QtyStepper product={p} /> : (
          <button className="grid h-9 w-9 place-items-center rounded-[10px] bg-cherry text-cotton transition hover:scale-105 hover:bg-cherry-dark disabled:bg-line disabled:text-ink-3"
            disabled={out} onClick={() => setQty(p, 1)} aria-label={out ? 'Out of stock' : `Add ${p.name} to cart`}><Plus size={18} /></button>
        )}
      </div>
    </article>
  );
}

export const ProductGrid = ({ items }: { items: P[] }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);
