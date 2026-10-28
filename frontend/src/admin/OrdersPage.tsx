import { ReactNode, useEffect, useState } from 'react';
import { staffApi, query } from '../lib/api';
import { dateTime, rs } from '../lib/format';
import type { Order, OrderStatus, Page } from '../lib/types';
import { useToast } from '../context/Toast';
import { PAYMENT_LABEL, StatusPill } from '../components/OrderBits';
import { useConfirm } from '../context/Confirm';
import { Modal, Pager } from '../components/ui';

type Result = Page<Order> & { counts: Partial<Record<OrderStatus, number>> };

const TABS: { key: OrderStatus | ''; label: string }[] = [
  { key: '', label: 'All' }, { key: 'placed', label: 'New' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for delivery' }, { key: 'delivered', label: 'Delivered' }, { key: 'cancelled', label: 'Cancelled' },
];
// what the main button says for each next step
export const ACTION: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Confirm', packed: 'Mark packed', out_for_delivery: 'Send out', delivered: 'Mark delivered', cancelled: 'Cancel order',
};

export default function OrdersPage() {
  const toast = useToast();
  const [f, setF] = useState({ status: '' as OrderStatus | '', q: '', page: 1 });
  const [data, setData] = useState<Result | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = () => staffApi<Result>('/admin/orders' + query(f)).then(setData).catch((e) => toast(e.message, true));
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = data ? Object.values(data.counts).reduce((a, n) => a + (n || 0), 0) : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const n = t.key ? data?.counts[t.key] || 0 : all;
          return (
            <button key={t.key} onClick={() => setF({ ...f, status: t.key, page: 1 })}
              className={`flex items-center gap-2 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13.5px] font-semibold transition ${f.status === t.key ? 'border-noir bg-noir text-cotton' : 'border-line bg-card hover:border-noir'}`}>
              {t.label}<span className={`rounded-full px-1.5 text-xs ${f.status === t.key ? 'bg-cotton/20' : 'bg-tint'}`}>{n}</span>
            </button>
          );
        })}
        <input className="input ml-auto max-w-xs" type="search" placeholder="Order number, name or phone" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} aria-label="Search orders" />
      </div>
      <OrdersTable orders={data?.items} onOpen={setOpenId} onChanged={load} />
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => setF({ ...f, page })} />}
      {openId && <OrderDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </>
  );
}

export function OrdersTable({ orders, onOpen, onChanged }: { orders?: Order[]; onOpen: (id: number) => void; onChanged: () => void }) {
  const toast = useToast();
  const ask = useConfirm();
  const move = async (o: Order, status: OrderStatus) => {
    if (status === 'cancelled' && !(await ask({ title: `Cancel ${o.orderNumber}?`, text: 'The customer is told and the items go back into stock.', yes: 'Cancel order', no: 'Keep order', danger: true }))) return;
    try {
      await staffApi(`/admin/orders/${o.id}/status`, { method: 'POST', body: { status } });
      toast(`${o.orderNumber}: ${ACTION[status]?.toLowerCase()} done`);
      onChanged();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
      <table className="w-full border-collapse text-sm">
        <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Area and slot</th><th className="th text-right">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th" /></tr></thead>
        <tbody>
          {orders?.map((o) => {
            const forward = o.next.find((s) => s !== 'cancelled');
            return (
              <tr key={o.id} className="cursor-pointer hover:bg-cotton/60" onClick={() => onOpen(o.id)}>
                <td className="td"><b className="block">{o.orderNumber}</b><small className="whitespace-nowrap text-ink-2">{dateTime(o.placedAt)}</small></td>
                <td className="td"><b className="block whitespace-nowrap">{o.customer?.name}</b><small className="text-ink-2">{o.customer?.phoneNumber.replace('+92', '0')}</small></td>
                <td className="td"><span className="block">{o.address.area}</span><small className="whitespace-nowrap text-ink-2">{o.deliverySlot}</small></td>
                <td className="td text-right font-bold tabular-nums">{rs(o.total)}<small className="block font-normal text-ink-2">{o.itemCount} items</small></td>
                <td className="td whitespace-nowrap">{PAYMENT_LABEL[o.payment.method]}<small className={`block ${o.payment.status === 'paid' ? 'text-ok' : 'text-ink-2'}`}>{o.payment.status === 'paid' ? 'Paid' : o.payment.status === 'refunded' ? 'Refunded' : 'Collect on delivery'}</small></td>
                <td className="td"><StatusPill status={o.status} label={o.statusLabel} /></td>
                <td className="td" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1.5">
                    {forward && <button className="btn btn-sm whitespace-nowrap" onClick={() => move(o, forward)}>{ACTION[forward]}</button>}
                    {o.next.includes('cancelled') && <button className="btn-ghost btn-sm" onClick={() => move(o, 'cancelled')}>Cancel</button>}
                  </div>
                </td>
              </tr>
            );
          })}
          {orders?.length === 0 && <tr><td colSpan={7} className="td py-10 text-center text-ink-2">No orders here yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function OrderDetail({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const ask = useConfirm();
  const [o, setO] = useState<Order | null>(null);
  const [remarks, setRemarks] = useState('');
  useEffect(() => {
    staffApi<Order>(`/admin/orders/${id}`).then(setO).catch((e) => toast(e.message, true));
  }, [id, toast]);

  const move = async (status: OrderStatus) => {
    if (status === 'cancelled' && !(await ask({ title: 'Cancel this order?', text: 'The customer is told and the items go back into stock.', yes: 'Cancel order', no: 'Keep order', danger: true }))) return;
    try {
      setO(await staffApi<Order>(`/admin/orders/${id}/status`, { method: 'POST', body: { status, remarks: remarks || undefined } }));
      setRemarks('');
      toast('Order updated');
      onChanged();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <Modal title={o ? `Order ${o.orderNumber}` : 'Order'} onClose={onClose} wide>
      {!o ? <p className="py-8 text-center text-ink-2">Loading…</p> : (
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2"><StatusPill status={o.status} label={o.statusLabel} /><span className="text-sm text-ink-2">Placed {dateTime(o.placedAt)}</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Box title="Customer"><b>{o.customer?.name}</b><br />{o.customer?.phoneNumber.replace('+92', '0')}</Box>
            <Box title="Deliver to"><b>{o.address.label}</b>, {o.address.addressLine}, {o.address.area}, {o.address.city}<br /><span className="text-ink-2">{o.deliverySlot}</span>{o.notes && <><br /><i>“{o.notes}”</i></>}</Box>
            <Box title="Shipping rules applied"><ul className="space-y-0.5">{o.shippingRules.map((r) => <li key={r}>{r}</li>)}</ul></Box>
            <Box title="Payment">{PAYMENT_LABEL[o.payment.method]}, {o.payment.status}{o.payment.transactionRef && <><br /><span className="text-ink-2">Ref {o.payment.transactionRef}</span></>}</Box>
          </div>
          <div className="rounded-xl border-[1.5px] border-line bg-card p-3.5 text-sm">
            {o.items?.map((i) => <div key={i.name} className="flex justify-between py-1"><span>{i.quantity} × {i.name} <small className="text-ink-3">{i.unit}</small></span><span className="tabular-nums">{rs(i.lineTotal)}</span></div>)}
            <div className="mt-2 border-t border-line pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{rs(o.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{o.deliveryFee ? rs(o.deliveryFee) : 'Free'}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{rs(o.total)}</span></div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-bold">History</h4>
            <ol className="space-y-1.5 border-l-2 border-line pl-4 text-sm">
              {o.history?.map((h) => <li key={h.at + h.status}><b>{h.label}</b> <span className="text-ink-3">{dateTime(h.at)}{h.by && `, by ${h.by}`}</span>{h.remarks && <span className="block text-ink-2">{h.remarks}</span>}</li>)}
            </ol>
          </div>
          {o.next.length > 0 && (
            <div className="flex flex-wrap items-end gap-2.5 border-t border-dashed border-line pt-4">
              <label className="flex min-w-[200px] flex-1 flex-col gap-1.5"><span className="label">Note with this update (optional)</span>
                <input className="input" maxLength={200} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Called customer, will deliver after 7 PM" /></label>
              {o.next.map((s) => <button key={s} className={s === 'cancelled' ? 'btn-ghost' : 'btn'} onClick={() => move(s)}>{ACTION[s]}</button>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

const Box = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl bg-tint p-3.5 text-sm"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-2">{title}</h4>{children}</div>
);
