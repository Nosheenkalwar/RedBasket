import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api } from '../lib/api';
import { rs } from '../lib/format';
import type { Order } from '../lib/types';
import { OrderProgress, PAYMENT_LABEL } from '../components/OrderBits';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/Auth';

export default function OrderPlaced() {
  const { number } = useParams();
  const { customer } = useAuth();
  const [o, setO] = useState<Order | null>(null);
  useEffect(() => {
    api<Order>(`/orders/${number}`).then(setO).catch(() => {});
  }, [number]);
  if (!o) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-10">
      <div className="panel p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok text-cotton"><Check size={32} strokeWidth={3} /></span>
        <h1 className="display mt-4 text-[clamp(30px,4vw,40px)]">Shukriya, {customer?.firstName}!</h1>
        <p className="mt-1 text-ink-2">Your order <b className="text-noir">{o.orderNumber}</b> is placed. We will confirm it shortly.</p>
        <div className="mx-auto mt-6 max-w-md text-left"><OrderProgress status={o.status} /></div>
        <dl className="mt-6 grid gap-x-6 gap-y-2.5 rounded-xl bg-tint p-4 text-left text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-ink-2">Delivery</dt><dd className="font-semibold">{o.deliverySlot}</dd>
          <dt className="text-ink-2">Address</dt><dd className="font-semibold">{o.address.addressLine}, {o.address.area}, Karachi</dd>
          <dt className="text-ink-2">Payment</dt><dd className="font-semibold">{PAYMENT_LABEL[o.payment.method]}{o.payment.status === 'paid' && `, paid (${o.payment.transactionRef})`}</dd>
          <dt className="text-ink-2">Total</dt><dd className="font-semibold">{rs(o.total)} <span className="font-normal text-ink-2">({o.itemCount} items{o.deliveryFee ? `, delivery ${rs(o.deliveryFee)}` : ', free delivery'})</span></dd>
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/account/orders" className="btn">Track my order</Link>
          <Link to="/" className="btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
