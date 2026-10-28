import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { api, query } from '../lib/api';
import { onlyDigits } from '../lib/validate';
import type { Page, ProductCard } from '../lib/types';
import { useCategories } from '../lib/useCategories';
import { ProductGrid } from '../components/ProductBits';
import Dropdown from '../components/Dropdown';
import { Empty, Pager, Spinner } from '../components/ui';

type Result = Page<ProductCard> & { brands: string[] };

/** /c/:id (a category) and /search?q= share this page. Filters live in the URL so they survive a refresh. */
export default function Listing() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const cats = useCategories();
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState('');

  const cat = cats.find((c) => String(c.id) === id);
  const q = params.get('q') || '';
  const sub = params.get('sub') || '';
  const brands = (params.get('brands') || '').split(',').filter(Boolean);
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') === 'true';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  const priceError = minPrice && maxPrice && Number(minPrice) > Number(maxPrice) ? 'Minimum is higher than maximum.' : '';

  useEffect(() => {
    if (priceError) return;
    setError('');
    const t = setTimeout(() => {
      api<Result>('/products' + query({ q, category: id, sub, brands: brands.join(','), minPrice, maxPrice, inStock, sort, page }))
        .then(setData).catch((e) => setError(e.message));
    }, 250); // small wait so typing a price does not fire a request per key
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, id]);

  const title = q ? `Results for “${q}”` : cat?.name || 'All products';
  const subName = cat?.subcategories.find((s) => String(s.id) === sub)?.name;
  const chips = useMemo(() => [
    ...(subName ? [{ label: subName, clear: { sub: undefined } }] : []),
    ...brands.map((b) => ({ label: b, clear: { brands: brands.filter((x) => x !== b).join(',') || undefined } })),
    ...(minPrice || maxPrice ? [{ label: `Rs. ${minPrice || 0} to ${maxPrice || 'any'}`, clear: { minPrice: undefined, maxPrice: undefined } }] : []),
    ...(inStock ? [{ label: 'In stock', clear: { inStock: undefined } }] : []),
  ], [subName, brands, minPrice, maxPrice, inStock]);

  const toggleBrand = (b: string) => update({ brands: (brands.includes(b) ? brands.filter((x) => x !== b) : [...brands, b]).join(',') || undefined });

  return (
    <div className="mx-auto max-w-7xl px-5">
      <nav className="flex flex-wrap gap-2 pb-1.5 pt-5 text-[13.5px] text-ink-2"><Link to="/" className="font-semibold text-noir">Home</Link> / <span>{title}</span></nav>
      <div className="grid items-start gap-6 pt-2 lg:grid-cols-[240px_1fr]">
        <details className="panel flex flex-col gap-4 lg:sticky lg:top-44" open={window.innerWidth > 1024}>
          <summary className="flex cursor-pointer items-center gap-2 font-bold lg:hidden"><SlidersHorizontal size={16} /> Filters</summary>
          <div className="mt-4 flex flex-col gap-5 lg:mt-0">
            {cat && (
              <Group title="Sub-category">
                <Radio name="sub" checked={!sub} onChange={() => update({ sub: undefined })} label={`All ${cat.name}`} />
                {cat.subcategories.map((s) => <Radio key={s.id} name="sub" checked={sub === String(s.id)} onChange={() => update({ sub: String(s.id) })} label={`${s.name} (${s.productCount})`} />)}
              </Group>
            )}
            <Group title="Price (Rs.)">
              <div className="flex items-center gap-2">
                <input className={`input py-2 tabular-nums ${priceError ? 'input-bad' : ''}`} inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={minPrice} onChange={(e) => update({ minPrice: onlyDigits(e.target.value, 7) || undefined })} />
                <span className="text-ink-2">to</span>
                <input className={`input py-2 tabular-nums ${priceError ? 'input-bad' : ''}`} inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={maxPrice} onChange={(e) => update({ maxPrice: onlyDigits(e.target.value, 7) || undefined })} />
              </div>
              {priceError && <span className="text-[12.5px] font-semibold text-cherry">{priceError}</span>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[['0', '500', 'Under 500'], ['500', '1500', '500 to 1,500'], ['1500', '', '1,500+']].map(([lo, hi, l]) => (
                  <button key={l} className="rounded-lg border-[1.5px] border-line bg-cotton px-2.5 py-1 text-[12.5px] font-semibold hover:border-noir" onClick={() => update({ minPrice: lo === '0' ? undefined : lo, maxPrice: hi || undefined })}>{l}</button>
                ))}
              </div>
            </Group>
            {data && data.brands.length > 0 && (
              <Group title="Brand">
                <div className="max-h-56 overflow-auto">
                  {data.brands.map((b) => (
                    <label key={b} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />{b}</label>
                  ))}
                </div>
              </Group>
            )}
            <Group title="Availability">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? 'true' : undefined })} />In stock only</label>
            </Group>
            {chips.length > 0 && <button className="btn-ghost btn-sm" onClick={() => setParams(q ? { q } : {}, { replace: true })}>Clear filters</button>}
          </div>
        </details>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="display text-[clamp(28px,4vw,40px)]">{subName || title}</h1><span className="text-ink-2">{data ? `${data.total} product${data.total === 1 ? '' : 's'}` : ' '}</span></div>
            <Dropdown className="w-56" label="Sort by" value={sort} onChange={(v) => update({ sort: v })}
              options={[{ value: 'newest', label: 'Newest first' }, { value: 'price_asc', label: 'Price: low to high' }, { value: 'price_desc', label: 'Price: high to low' }, { value: 'name', label: 'Name: A to Z' }]} />
          </div>
          {chips.length > 0 && (
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 rounded-lg bg-tint py-1 pl-3 pr-1 text-[13px] font-semibold">{c.label}
                  <button className="rounded p-0.5 hover:bg-black/10" onClick={() => update(c.clear)} aria-label={`Remove filter ${c.label}`}><X size={14} /></button></span>
              ))}
            </div>
          )}
          {error ? <Empty icon={<X size={30} />} title="Could not load products" text={error} />
            : !data ? <Spinner />
            : data.items.length === 0 ? <Empty icon={<SlidersHorizontal size={30} />} title="Nothing matches these filters" text="Try a wider price range or clear a filter." action={<button className="btn" onClick={() => setParams(q ? { q } : {})}>Clear filters</button>} />
            : <><ProductGrid items={data.items} /><Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => { update({ page: String(p) }); window.scrollTo(0, 0); }} /></>}
        </div>
      </div>
    </div>
  );
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div><h4 className="mb-2.5 text-sm font-bold">{title}</h4>{children}</div>
);
const Radio = ({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm"><input type="radio" name={name} checked={checked} onChange={onChange} />{label}</label>
);
