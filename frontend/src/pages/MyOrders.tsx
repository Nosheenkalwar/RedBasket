import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { api } from '../lib/api';
import { dateTime, rs } from '../lib/format';
import type { Order } from '../lib/types';
import { useToast } from '../context/Toast';
import { OrderProgress, PAYMENT_LABEL, StatusPill } from '../components/OrderBits';
import { useConfirm } from '../context/Confirm';
import { Empty, Spinner } from '../components/ui';

export default function MyOrders() {
  const toast = useToast();
  const ask = useConfirm();
  const [list, setList] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<Order | null>(null);

  const load = () => api<Order[]>('/orders').then(setList).catch((e) => toast(e.message, true));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const view = async (o: Order) => setOpen(open?.id === o.id ? null : await api<Order>(`/orders/${o.orderNumber}`));
  const cancel = async (o: Order) => {
    if (!(await ask({ title: `Cancel order ${o.orderNumber}?`, text: 'Your items go back on the shelf. If you paid by card, the amount is refunded.', yes: 'Cancel order', no: 'Keep order', danger: true }))) return;
    try {
      setOpen(await api<Order>(`/orders/${o.orderNumber}/cancel`, { method: 'POST' }));
      toast(`${o.orderNumber} cancelled`);
      load();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  if (!list) return <Spinner />;
  return (
    <>
      <h1 className="display text-[clamp(28px,3.6vw,38px)]">My orders</h1>
      <p className="mb-4 mt-1 text-ink-2">Follow each order from the store to your door. You can cancel until it is packed.</p>
      {list.length === 0 && <Empty icon={<Package size={30} />} title="No orders yet" text="When you place an order it shows up here." action={<Link to="/" className="btn">Start shopping</Link>} />}
      <div className="flex flex-col gap-3">
        {list.map((o) => (
          <div key={o.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <b>{o.orderNumber}</b><StatusPill status={o.status} label={o.statusLabel} />
              <span className="text-sm text-ink-2">{dateTime(o.placedAt)}</span>
              <span className="ml-auto font-bold tabular-nums">{rs(o.total)}</span>
            </div>
            <p className="mt-1 text-sm text-ink-2">{o.itemCount} items, {o.deliverySlot}, {PAYMENT_LABEL[o.payment.method]}</p>
            <div className="mt-3 max-w-lg"><OrderProgress status={o.status} /></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-ghost btn-sm" onClick={() => view(o)}>{open?.id === o.id ? 'Hide details' : 'View details'}</button>
              {o.next.includes('cancelled') && <button className="btn-sm font-semibold text-cherry underline" onClick={() => cancel(o)}>Cancel order</button>}
            </div>
            {open?.id === o.id && (
              <div className="mt-4 grid gap-4 border-t border-dashed border-line pt-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-bold">Items</h4>
                  {open.items?.map((i) => <div key={i.name} className="flex justify-between py-1 text-sm"><span>{i.quantity} × {i.name} <small className="text-ink-3">{i.unit}</small></span><span className="tabular-nums">{rs(i.lineTotal)}</span></div>)}
                  <div className="mt-2 border-t border-line pt-2 text-sm">
                    <div className="flex justify-between"><span>Delivery</span><span>{open.deliveryFee ? rs(open.deliveryFee) : 'Free'}</span></div>
                    <div className="flex justify-between font-bold"><span>Total</span><span>{rs(open.total)}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-bold">Updates</h4>
                  <ol className="space-y-2 border-l-2 border-line pl-4 text-sm">
                    {open.history?.map((h) => <li key={h.at + h.status}><b>{h.label}</b> <span className="text-ink-3">{dateTime(h.at)}</span>{h.remarks && <span className="block text-ink-2">{h.remarks}</span>}</li>)}
                  </ol>
                  <p className="mt-3 text-sm text-ink-2">Deliver to {open.address.addressLine}, {open.address.area}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
