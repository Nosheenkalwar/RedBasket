import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, RotateCcw, Truck, Tags } from 'lucide-react';
import { api } from '../lib/api';
import type { Page, ProductCard } from '../lib/types';
import { useCategories } from '../lib/useCategories';
import { ProductGrid } from '../components/ProductBits';
import { useAuth } from '../context/Auth';
import HomeBanner from '../components/HomeBanner';

export default function Home() {
  const { customer } = useAuth();
  const cats = useCategories();
  const [fresh, setFresh] = useState<ProductCard[]>([]);
  const [rows, setRows] = useState<Record<number, ProductCard[]>>({});

  useEffect(() => {
    api<Page<ProductCard>>('/products?sort=newest&pageSize=6').then((r) => setFresh(r.items)).catch(() => {});
  }, []);

  // a short row for each of the first three categories
  useEffect(() => {
    cats.slice(0, 3).forEach((c) =>
      api<Page<ProductCard>>(`/products?category=${c.id}&pageSize=6&sort=name`).then((r) => setRows((p) => ({ ...p, [c.id]: r.items }))).catch(() => {}));
  }, [cats]);

  return (
    <div className="mx-auto max-w-7xl px-5">
      {customer && <div className="flex flex-wrap items-center justify-between gap-3 pt-5"><h2 className="display text-[26px]">Salaam, {customer.firstName}.</h2><span className="text-ink-2">Delivering across Karachi today</span></div>}

      <HomeBanner cats={cats} />

      <Section title="New arrivals" items={fresh} />
      {cats.slice(0, 3).map((c) => <Section key={c.id} title={c.name} items={rows[c.id] || []} more={`/c/${c.id}`} />)}

      <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2.5 border-y-[1.5px] border-dashed border-line p-4 text-sm text-ink-2">
        <span className="flex items-center gap-2"><Truck size={18} className="text-cherry" /><b className="text-noir">Same day</b> delivery across Karachi</span>
        <span className="flex items-center gap-2"><Leaf size={18} className="text-cherry" /><b className="text-noir">Fresh & quality</b> products you can trust</span>
        <span className="flex items-center gap-2"><Tags size={18} className="text-cherry" /><b className="text-noir">Amazing deals</b> and offers every day</span>
        <span className="flex items-center gap-2"><RotateCcw size={18} className="text-cherry" /><b className="text-noir">Easy returns</b> and exchanges hassle free</span>
      </div>
    </div>
  );
}

function Section({ title, items, more }: { title: string; items: ProductCard[]; more?: string }) {
  if (!items.length) return null;
  return (
    <section className="pt-8">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="display squiggle text-[clamp(24px,3vw,32px)]">{title}</h2>
        {more && <Link to={more} className="link">See more</Link>}
      </div>
      <ProductGrid items={items} />
    </section>
  );
}
