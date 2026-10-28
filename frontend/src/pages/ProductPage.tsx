import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, PackageX, ShoppingCart } from 'lucide-react';
import { api } from '../lib/api';
import { rs } from '../lib/format';
import type { ProductDetail } from '../lib/types';
import { ProductGrid, ProductImage, QtyStepper, StockPill } from '../components/ProductBits';
import { Empty, Spinner } from '../components/ui';
import { useShop } from '../context/Shop';

export default function ProductPage() {
  const { id } = useParams();
  const [p, setP] = useState<ProductDetail | null>(null);
  const [error, setError] = useState('');
  const { qtyOf, setQty, isWished, toggleWish, setDrawerOpen } = useShop();

  useEffect(() => {
    setP(null);
    setError('');
    api<ProductDetail>(`/products/${id}`).then(setP).catch((e) => setError(e.message));
    window.scrollTo(0, 0);
  }, [id]);

  if (error) return <div className="mx-auto max-w-xl px-5 pt-10"><Empty icon={<PackageX size={30} />} title="Product not found" text={error} action={<Link to="/" className="btn">Back to the store</Link>} /></div>;
  if (!p) return <Spinner />;

  const wished = isWished(p.id);
  const q = qtyOf(p.id);
  const availability = p.stockStatus === 'out_of_stock' ? 'Out of stock' : p.stockStatus === 'low_stock' ? `Only ${p.stock} left` : 'In stock';

  return (
    <div className="mx-auto max-w-7xl px-5">
      <nav className="flex flex-wrap gap-2 pb-1.5 pt-5 text-[13.5px] text-ink-2">
        <Link to="/" className="font-semibold text-noir">Home</Link> /
        {p.category && <><Link to={`/c/${p.category.id}`} className="font-semibold text-noir">{p.category.name}</Link> /</>}
        <Link to={`/c/${p.category?.id}?sub=${p.subcategory.id}`} className="font-semibold text-noir">{p.subcategory.name}</Link> / <span>{p.name}</span>
      </nav>
      <div className="grid gap-10 py-3 md:grid-cols-2">
        <div className="aspect-[1/0.9] rounded-2xl border border-line bg-white p-7 text-[clamp(100px,18vw,190px)]"><ProductImage p={p} /></div>
        <div>
          <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-cherry">{p.brand}</span>
          <h1 className="display mt-1.5 text-[clamp(30px,4vw,46px)] leading-[1.05]">{p.name}</h1>
          <p className="mt-1.5 text-ink-2">{p.subcategory.name}, {p.unit}</p>
          <div className="mb-1 mt-3.5 text-3xl font-bold tabular-nums">{rs(p.price)}</div>
          <div className="my-5 flex flex-wrap items-center gap-3">
            {p.stockStatus === 'out_of_stock' ? <button className="btn" disabled>Out of stock</button>
              : q ? <><QtyStepper product={p} size={18} /><button className="btn" onClick={() => setDrawerOpen(true)}>View cart</button></>
              : <button className="btn" onClick={() => setQty(p, 1)}><ShoppingCart size={18} /> Add to cart</button>}
            <button className="btn-ghost" onClick={() => toggleWish(p)} aria-pressed={wished}><Heart size={18} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'Saved' : 'Save'}</button>
          </div>
          <dl className="my-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink-2">Availability</dt><dd className="flex items-center gap-2 font-semibold">{availability} <StockPill status={p.stockStatus} stock={p.stock} /></dd>
            <dt className="text-ink-2">Delivery</dt><dd className="font-semibold">Same day in Karachi if you order before 4 PM</dd>
            <dt className="text-ink-2">Item code</dt><dd className="font-semibold">{p.sku}</dd>
          </dl>
          <p className="max-w-[52ch] text-ink-2">{p.description}</p>
        </div>
      </div>
      {p.related.length > 0 && (
        <section className="pt-8"><h2 className="display squiggle mb-4 text-[clamp(24px,3vw,32px)]">More from {p.subcategory.name}</h2><ProductGrid items={p.related} /></section>
      )}
    </div>
  );
}
