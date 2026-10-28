import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { rs } from '../lib/format';
import type { ProductCard } from '../lib/types';
import { ProductImage } from './ProductBits';

/** live search: results appear while typing, arrow keys + Enter work, the last row runs a full search */
export default function SearchBox() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [hits, setHits] = useState<ProductCard[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!q.trim()) return setHits([]);
    const t = setTimeout(() => api<ProductCard[]>('/products/suggest?q=' + encodeURIComponent(q.trim())).then(setHits).catch(() => setHits([])), 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    nav(path);
  };
  const searchAll = () => q.trim() && go('/search?q=' + encodeURIComponent(q.trim()));
  const rows = hits.length + 1; // products + the "Search for" row

  return (
    <form ref={box} role="search" className="relative w-full max-w-[620px] justify-self-center"
      onSubmit={(e) => { e.preventDefault(); active >= 0 && active < hits.length ? go(`/p/${hits[active].id}`) : searchAll(); }}>
      <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-card py-1 pl-4 pr-1 focus-within:border-cherry">
        <Search size={18} className="text-ink-3" />
        <input value={q} placeholder="Search groceries, electronics, clothing" aria-label="Search products" autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 outline-none"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !q.trim()) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % rows); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + rows) % rows); }
            if (e.key === 'Escape') setOpen(false);
          }} />
        {q && <button type="button" className="p-1 text-ink-3 hover:text-noir" onClick={() => { setQ(''); setHits([]); }} aria-label="Clear search"><X size={16} /></button>}
        <button className="btn btn-sm">Search</button>
      </div>

      {open && q.trim() && (
        <div className="absolute inset-x-0 top-[calc(100%+2px)] z-50 overflow-hidden rounded-b-xl border-[1.5px] border-line bg-white shadow-[0_22px_44px_-20px_rgba(27,23,22,.5)]" role="listbox">
          <h6 className="px-5 pb-3 pt-4 text-lg font-bold">Products</h6>
          {hits.length === 0 && <p className="border-t border-dashed border-line px-5 py-4 text-sm text-ink-2">No products match “{q.trim()}”.</p>}
          {hits.map((p, i) => (
            <button type="button" key={p.id} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(`/p/${p.id}`)}
              className={`grid w-full grid-cols-[56px_1fr] items-center gap-5 border-t border-dashed border-line px-5 py-3 text-left ${i === active ? 'bg-cotton' : ''}`}>
              <span className="h-14 w-14 text-4xl"><ProductImage p={p} /></span>
              <span>
                <span className="block leading-snug">{p.name}{/^(each|per )/.test(p.unit) ? '' : ` (${p.unit})`}</span>
                <span className="block text-cherry tabular-nums">{rs(p.price).replace('Rs. ', 'Rs.')}</span>
              </span>
            </button>
          ))}
          <button type="button" onMouseEnter={() => setActive(hits.length)} onClick={searchAll}
            className={`flex w-full items-center justify-between border-t border-dashed border-line px-5 py-3.5 font-semibold ${active === hits.length ? 'bg-cotton' : ''}`}>
            Search for “{q.trim()}” <ArrowRight size={20} />
          </button>
        </div>
      )}
    </form>
  );
}
