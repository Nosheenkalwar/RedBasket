import { ChangeEvent, useEffect, useState } from 'react';
import { ImagePlus, Plus } from 'lucide-react';
import { staffApi, query } from '../lib/api';
import { emojiFor, rs } from '../lib/format';
import { useForm } from '../lib/useForm';
import { onlyDigits, rules } from '../lib/validate';
import type { Page } from '../lib/types';
import { useToast } from '../context/Toast';
import { Field } from '../components/fields';
import Dropdown from '../components/Dropdown';
import { useConfirm } from '../context/Confirm';
import { Modal, Pager } from '../components/ui';

type Cat = { id: number; name: string; subcategories: { id: number; name: string }[] };
type Product = {
  id: number; name: string; sku: string; brand: string; unit: string; price: number; costPrice: number | null; leadTimeDays: number;
  description: string; imageUrl: string | null; isActive: boolean;
  category: { id: number; name: string; parent: { id: number; name: string } }; inventory: { quantityOnHand: number };
};

const txt = 'whitespace-nowrap rounded-md border-[1.5px] border-line bg-cotton px-2.5 py-1 text-[12.5px] font-semibold transition hover:border-noir';

export default function ProductsPage() {
  const toast = useToast();
  const ask = useConfirm();
  const [cats, setCats] = useState<Cat[]>([]);
  const [f, setF] = useState({ q: '', categoryId: '', status: '', page: 1 });
  const [data, setData] = useState<Page<Product> | null>(null);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  useEffect(() => {
    staffApi<Cat[]>('/admin/categories').then(setCats).catch(() => {});
  }, []);
  const load = () => staffApi<Page<Product>>('/admin/products' + query(f)).then(setData).catch((e) => toast(e.message, true));
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  const act = async (path: string, method: string, done: string) => {
    try {
      await staffApi(path, { method });
      toast(done);
      load();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <input className="input max-w-xs" type="search" placeholder="Search name, SKU or brand" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} aria-label="Search products" />
        <Dropdown className="w-56" ariaLabel="Filter by category" searchable value={f.categoryId} onChange={(categoryId) => setF({ ...f, categoryId, page: 1 })}
          options={[{ value: '', label: 'All categories' }, ...cats.flatMap((c) => [{ value: String(c.id), label: `All ${c.name}`, group: c.name }, ...c.subcategories.map((s) => ({ value: String(s.id), label: s.name, group: c.name }))])]} />
        <Dropdown className="w-60" ariaLabel="Filter by status" value={f.status} onChange={(status) => setF({ ...f, status, page: 1 })}
          options={[{ value: '', label: 'Published and hidden' }, { value: 'active', label: 'Published' }, { value: 'hidden', label: 'Hidden' }]} />
        <button className="btn btn-sm ml-auto" onClick={() => setEditing('new')}><Plus size={15} /> Add product</button>
      </div>

      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th">Sub-category</th><th className="th text-right">Price</th><th className="th text-right">Stock</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className={p.isActive ? '' : 'opacity-55'}>
                <td className="td"><div className="flex min-w-[200px] items-center gap-2.5">
                  <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-lg border border-line bg-white text-xl">{p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-contain" /> : emojiFor(p.category.name)}</span>
                  <span><b className="block">{p.name}</b><small className="text-ink-2">{p.brand}, {p.unit}</small></span></div></td>
                <td className="td tabular-nums">{p.sku}</td>
                <td className="td">{p.category.name}<small className="block text-ink-2">{p.category.parent.name}</small></td>
                <td className="td text-right tabular-nums">{rs(p.price)}</td>
                <td className="td text-right tabular-nums">{p.inventory?.quantityOnHand ?? 0}</td>
                <td className="td"><span className={`pill ${p.isActive ? 'bg-ok-soft text-ok' : ''}`}>{p.isActive ? 'Published' : 'Hidden'}</span></td>
                <td className="td"><div className="flex justify-end gap-1.5">
                  <button className={txt} onClick={() => setEditing(p)}>Edit</button>
                  <button className={`${txt} ${p.isActive ? '' : 'border-ok text-ok'}`}
                    onClick={() => act(`/admin/products/${p.id}/${p.isActive ? 'hide' : 'show'}`, 'POST', `${p.name} ${p.isActive ? 'hidden' : 'published'}`)}>{p.isActive ? 'Hide' : 'Publish'}</button>
                  <button className={`${txt} text-cherry hover:border-cherry`}
                    onClick={async () => (await ask({ title: `Delete ${p.name}?`, text: 'This cannot be undone. Products that have been sold or stocked can only be hidden.', yes: 'Delete', danger: true })) && act(`/admin/products/${p.id}`, 'DELETE', `${p.name} deleted`)}>Delete</button>
                </div></td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={7} className="td py-8 text-center text-ink-2">No products match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => setF({ ...f, page })} />}
      {editing && <ProductForm product={editing === 'new' ? null : editing} cats={cats} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

const MAX_IMAGE = 2 * 1024 * 1024;

function ProductForm({ product: p, cats, onClose, onSaved }: { product: Product | null; cats: Cat[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const form = useForm({
    name: p?.name || '', sku: p?.sku || 'RB-', brand: p?.brand || '', categoryId: p ? String(p.category.id) : '',
    price: p ? String(p.price) : '', costPrice: p?.costPrice ? String(p.costPrice) : '', unit: p?.unit || '',
    leadTimeDays: String(p?.leadTimeDays ?? 3), description: p?.description || '', imageUrl: p?.imageUrl || '',
  }, {
    name: rules.length('name', 2, 80),
    sku: (v) => (/^[A-Z0-9-]{3,20}$/.test(v) ? '' : 'SKU: 3 to 20 capital letters, numbers or dashes, like RB-1050.'),
    brand: rules.length('brand', 1, 40),
    categoryId: (v) => (v ? '' : 'Choose a sub-category.'),
    price: rules.number('price', 1, 1_000_000),
    costPrice: (v, all) => (!v ? '' : Number(v) > Number(all.price) ? 'Cost is higher than the selling price.' : ''),
    unit: rules.length('unit', 1, 30),
    leadTimeDays: rules.number('lead time', 1, 90),
  });
  const v = form.values;

  const upload = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast('Use a JPG, PNG or WebP image.', true);
    if (file.size > MAX_IMAGE) return toast('The image must be 2 MB or smaller.', true);
    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    try {
      form.set('imageUrl', (await staffApi<{ url: string }>('/admin/products/image', { method: 'POST', body })).url);
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError('');
    if (!form.validate()) return;
    const body = { ...v, categoryId: Number(v.categoryId), price: Number(v.price), costPrice: v.costPrice ? Number(v.costPrice) : null, leadTimeDays: Number(v.leadTimeDays), imageUrl: v.imageUrl || null };
    try {
      await staffApi(p ? `/admin/products/${p.id}` : '/admin/products', { method: p ? 'PUT' : 'POST', body });
      toast(p ? 'Product saved' : `${v.name} added with 0 stock. Inventory staff can add stock now.`);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const money = (k: 'price' | 'costPrice') => (e: ChangeEvent<HTMLInputElement>) => form.set(k, e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 10));

  return (
    <Modal title={p ? 'Edit product' : 'Add product'} onClose={onClose} wide>
      <form className="mt-3 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field label="Name" placeholder="Basmati Rice" value={v.name} onChange={(e) => form.set('name', e.target.value.slice(0, 80))} error={form.error('name')} />
          <Field label="SKU" value={v.sku} onChange={(e) => form.set('sku', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))} error={form.error('sku')} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brand" placeholder="Guard" value={v.brand} onChange={(e) => form.set('brand', e.target.value.slice(0, 40))} error={form.error('brand')} />
          <Dropdown label="Sub-category" placeholder="Choose a sub-category" searchable value={v.categoryId} onChange={(id) => form.set('categoryId', id)} error={form.error('categoryId')}
            options={cats.flatMap((c) => c.subcategories.map((s) => ({ value: String(s.id), label: s.name, group: c.name })))} />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Price (Rs.)" inputMode="decimal" value={v.price} onChange={money('price')} error={form.error('price')} />
          <Field label="Cost (Rs.)" inputMode="decimal" placeholder="Optional" value={v.costPrice} onChange={money('costPrice')} error={form.error('costPrice')} />
          <Field label="Unit" placeholder="5 kg, each" value={v.unit} onChange={(e) => form.set('unit', e.target.value.slice(0, 30))} error={form.error('unit')} />
          <Field label="Lead time (days)" inputMode="numeric" value={v.leadTimeDays} onChange={(e) => form.set('leadTimeDays', onlyDigits(e.target.value, 2))} error={form.error('leadTimeDays')} />
        </div>
        <label className="flex flex-col gap-1.5"><span className="label">Description</span>
          <textarea className="input min-h-20 resize-y" maxLength={1000} value={v.description} onChange={(e) => form.set('description', e.target.value)} />
          <span className="text-xs text-ink-3">{v.description.length}/1000</span></label>
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-line bg-white text-3xl">{v.imageUrl ? <img src={v.imageUrl} alt="" className="h-full w-full object-contain" /> : emojiFor()}</span>
          <label className="btn-ghost btn-sm cursor-pointer"><ImagePlus size={15} /> {uploading ? 'Uploading…' : v.imageUrl ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label>
          {v.imageUrl && <button type="button" className="link text-sm" onClick={() => form.set('imageUrl', '')}>Remove</button>}
          <span className="text-xs text-ink-3">JPG, PNG or WebP, up to 2 MB</span>
        </div>
        {error && <p className="text-sm font-semibold text-cherry">{error}</p>}
        <div className="mt-1 flex gap-2.5"><button className="btn" disabled={uploading}>{p ? 'Save changes' : 'Add product'}</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
