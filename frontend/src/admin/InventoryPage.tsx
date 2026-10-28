import { useEffect, useState } from 'react';
import { PackagePlus, SlidersHorizontal } from 'lucide-react';
import { staffApi, query } from '../lib/api';
import { dateTime, STOCK_LABEL } from '../lib/format';
import { useForm } from '../lib/useForm';
import { onlyDigits, rules } from '../lib/validate';
import type { Page, StockStatus } from '../lib/types';
import { useToast } from '../context/Toast';
import { Field } from '../components/fields';
import Dropdown from '../components/Dropdown';
import { Modal, Pager } from '../components/ui';

type Row = { productId: number; name: string; sku: string; unit: string; subcategory: string; isActive: boolean; quantityOnHand: number; reorderPoint: number; status: StockStatus; updatedAt: string };
type Move = { id: number; movementType: 'stock_in' | 'correction'; quantityChange: number; quantityAfter: number; note: string; createdAt: string; product: { name: string; sku: string }; staff: { fullName: string } | null };

const STATUS_PILL: Record<StockStatus, string> = { in_stock: 'bg-ok-soft text-ok', low_stock: 'bg-warn-soft text-warn', out_of_stock: 'bg-noir text-cotton' };
const TYPE_LABEL = { stock_in: 'Stock in', correction: 'Correction' };

export default function InventoryPage() {
  const [tab, setTab] = useState<'levels' | 'history'>('levels');
  const tabCls = (on: boolean) => `-mb-[1.5px] border-b-[2.5px] px-3.5 py-2.5 font-semibold ${on ? 'border-cherry text-noir' : 'border-transparent text-ink-2'}`;
  return (
    <>
      <div className="flex gap-1 border-b-[1.5px] border-line">
        <button className={tabCls(tab === 'levels')} onClick={() => setTab('levels')}>Stock levels</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>Stock history</button>
      </div>
      {tab === 'levels' ? <Levels /> : <HistoryList />}
    </>
  );
}

function Levels() {
  const toast = useToast();
  const [f, setF] = useState({ q: '', status: '', page: 1 });
  const [data, setData] = useState<Page<Row> | null>(null);
  const [action, setAction] = useState<{ kind: 'in' | 'adjust'; row: Row } | null>(null);

  const load = () => staffApi<Page<Row>>('/admin/inventory' + query(f)).then(setData).catch((e) => toast(e.message, true));
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <input className="input max-w-xs" type="search" placeholder="Search name or SKU" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} aria-label="Search stock" />
        <Dropdown className="w-48" ariaLabel="Filter by stock status" value={f.status} onChange={(status) => setF({ ...f, status, page: 1 })}
          options={[{ value: '', label: 'All stock levels' }, ...Object.entries(STOCK_LABEL).map(([value, label]) => ({ value, label }))]} />
      </div>
      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th text-right">On hand</th><th className="th text-right">Reorder at</th><th className="th">Status</th><th className="th">Last change</th><th className="th" /></tr></thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.productId}>
                <td className="td"><b className="block">{r.name}</b><small className="text-ink-2">{r.subcategory}, {r.unit}{!r.isActive && ' (hidden)'}</small></td>
                <td className="td tabular-nums">{r.sku}</td>
                <td className="td text-right text-base font-bold tabular-nums">{r.quantityOnHand}</td>
                <td className="td text-right tabular-nums">{r.reorderPoint}</td>
                <td className="td"><span className={`pill ${STATUS_PILL[r.status]}`}>{STOCK_LABEL[r.status]}</span></td>
                <td className="td whitespace-nowrap text-ink-2">{dateTime(r.updatedAt)}</td>
                <td className="td"><div className="flex justify-end gap-1.5">
                  <button className="btn btn-sm" onClick={() => setAction({ kind: 'in', row: r })}><PackagePlus size={14} /> Stock in</button>
                  <button className="btn-ghost btn-sm" onClick={() => setAction({ kind: 'adjust', row: r })}><SlidersHorizontal size={14} /> Update</button>
                </div></td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={7} className="td py-8 text-center text-ink-2">No products match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => setF({ ...f, page })} />}
      {action && <StockForm {...action} onClose={() => setAction(null)} onSaved={() => { setAction(null); load(); }} />}
    </>
  );
}

/** "Stock in" adds received units. "Update" sets the counted quantity and saves the difference as a correction. */
function StockForm({ kind, row, onClose, onSaved }: { kind: 'in' | 'adjust'; row: Row; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [error, setError] = useState('');
  const stockIn = kind === 'in';
  const form = useForm(
    { quantity: '', newQuantity: String(row.quantityOnHand), reorderPoint: String(row.reorderPoint), note: '' },
    stockIn
      ? { quantity: rules.number('quantity', 1, 100000) }
      : { newQuantity: rules.number('counted quantity', 0, 100000), reorderPoint: rules.number('reorder point', 0, 10000), note: rules.length('reason', 3, 150) },
  );
  const v = form.values;
  const after = stockIn ? row.quantityOnHand + (Number(v.quantity) || 0) : Number(v.newQuantity) || 0;
  const change = after - row.quantityOnHand;

  const save = async () => {
    setError('');
    if (!form.validate()) return;
    if (!stockIn && change === 0 && Number(v.reorderPoint) === row.reorderPoint) return setError('Nothing changed. Enter the counted quantity or a new reorder point.');
    try {
      await staffApi(stockIn ? '/admin/inventory/stock-in' : '/admin/inventory/adjust', {
        method: 'POST',
        body: stockIn
          ? { productId: row.productId, quantity: Number(v.quantity), note: v.note.trim() || undefined }
          : { productId: row.productId, newQuantity: Number(v.newQuantity), reorderPoint: Number(v.reorderPoint), reason: v.note.trim() },
      });
      toast(`${row.name}: stock is now ${after}`);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title={stockIn ? 'Stock in' : 'Update stock'} onClose={onClose}>
      <p className="mb-4 text-ink-2"><b className="text-noir">{row.name}</b> ({row.sku}). {row.quantityOnHand} on hand now.</p>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        {stockIn ? (
          <>
            <Field label="Quantity received" inputMode="numeric" autoFocus value={v.quantity} onChange={(e) => form.set('quantity', onlyDigits(e.target.value, 6))} error={form.error('quantity')} />
            <Field label="Note (optional)" placeholder="Supplier delivery, invoice number" value={v.note} onChange={(e) => form.set('note', e.target.value.slice(0, 150))} />
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Counted quantity" inputMode="numeric" autoFocus value={v.newQuantity} onChange={(e) => form.set('newQuantity', onlyDigits(e.target.value, 6))} error={form.error('newQuantity')} />
              <Field label="Reorder point" inputMode="numeric" value={v.reorderPoint} onChange={(e) => form.set('reorderPoint', onlyDigits(e.target.value, 5))} error={form.error('reorderPoint')} hint="Low stock at or below this" />
            </div>
            <Field label="Reason" placeholder="Monthly stock count" value={v.note} onChange={(e) => form.set('note', e.target.value.slice(0, 150))} error={form.error('note')} />
          </>
        )}
        <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${change < 0 ? 'bg-warn-soft text-warn' : 'bg-tint'}`}>
          After saving: {after} on hand ({change >= 0 ? '+' : ''}{change})
        </p>
        {error && <p className="text-sm font-semibold text-cherry">{error}</p>}
        <div className="flex gap-2.5"><button className="btn">{stockIn ? 'Add stock' : 'Save stock'}</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

function HistoryList() {
  const toast = useToast();
  const [f, setF] = useState({ type: '', page: 1 });
  const [data, setData] = useState<Page<Move> | null>(null);
  useEffect(() => {
    staffApi<Page<Move>>('/admin/inventory/movements' + query(f)).then(setData).catch((e) => toast(e.message, true));
  }, [f, toast]);

  return (
    <>
      <Dropdown className="w-52 self-start" ariaLabel="Filter by movement type" value={f.type} onChange={(type) => setF({ type, page: 1 })}
        options={[{ value: '', label: 'All movements' }, ...Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))]} />
      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="th">When</th><th className="th">Product</th><th className="th">Type</th><th className="th text-right">Change</th><th className="th text-right">After</th><th className="th">By</th><th className="th">Note</th></tr></thead>
          <tbody>
            {data?.items.map((m) => (
              <tr key={m.id}>
                <td className="td whitespace-nowrap tabular-nums">{dateTime(m.createdAt)}</td>
                <td className="td"><b>{m.product.name}</b><small className="block text-ink-2">{m.product.sku}</small></td>
                <td className="td"><span className="pill">{TYPE_LABEL[m.movementType]}</span></td>
                <td className={`td text-right font-bold tabular-nums ${m.quantityChange < 0 ? 'text-cherry' : 'text-ok'}`}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</td>
                <td className="td text-right tabular-nums">{m.quantityAfter}</td>
                <td className="td whitespace-nowrap">{m.staff?.fullName || '–'}</td>
                <td className="td text-ink-2">{m.note}</td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={7} className="td py-8 text-center text-ink-2">No stock movements yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => setF({ ...f, page })} />}
      <p className="text-xs text-ink-3">Movements cannot be edited or deleted. Fix a mistake with a new update.</p>
    </>
  );
}
