import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../lib/api';
import { rs } from '../lib/format';
import type { Order, Role } from '../lib/types';
import { useStaff } from '../context/Staff';
import { ADMIN_NAV, canOpen } from './AdminShell';
import { OrderDetail, OrdersTable } from './OrdersPage';

type Card = { label: string; value: number; hint: string; money?: boolean };

const TAGLINE: Record<Role, string> = {
  SUPER_ADMIN: 'Right stock, right people, right on time.',
  SUB_ADMIN: 'Good products, well placed, sell themselves.',
  INVENTORY_STAFF: 'Count it right, keep it stocked.',
  SALES_STAFF: 'Every order packed right, every rider on time.',
};

export default function Dashboard() {
  const { staff } = useStaff();
  const role = staff!.role;
  const [cards, setCards] = useState<Card[]>([]);
  const [orders, setOrders] = useState<Order[] | undefined>();
  const [openId, setOpenId] = useState<number | null>(null);
  const seesOrders = canOpen(role, ADMIN_NAV.find((n) => n.to === '/admin/orders')!);

  const load = () => {
    staffApi<{ cards: Card[] }>('/admin/summary').then((r) => setCards(r.cards)).catch(() => {});
    // newest orders that still need someone to act on them
    if (seesOrders) Promise.all(['placed', 'confirmed', 'packed'].map((s) => staffApi<{ items: Order[] }>(`/admin/orders?status=${s}&pageSize=8`)))
      .then((r) => setOrders(r.flatMap((x) => x.items).sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 8))).catch(() => {});
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shortcuts = ADMIN_NAV.slice(1).filter((n) => canOpen(role, n));
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Karachi' });

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-noir px-7 py-6 text-cotton">
        <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-cherry/60" />
        <small className="relative text-[13px] text-cotton/70">{today}, Salaam {staff!.fullName.split(' ')[0]}</small>
        <h2 className="display relative mt-1 max-w-[22ch] text-[clamp(24px,3vw,34px)] leading-tight">{TAGLINE[role]}</h2>
      </section>

      {cards.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border-[1.5px] border-line bg-card p-4">
              <small className="block text-[12.5px] font-semibold text-ink-2">{c.label}</small>
              <b className="my-1 block text-3xl tabular-nums">{c.money ? rs(c.value) : c.value}</b>
              <span className="text-[13px] text-ink-2">{c.hint}</span>
            </div>
          ))}
        </div>
      )}

      {seesOrders && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <h3 className="display text-2xl">Orders to handle</h3>
            <Link to="/admin/orders" className="link text-sm">All orders</Link>
          </div>
          <OrdersTable orders={orders} onOpen={setOpenId} onChanged={load} />
        </section>
      )}

      {shortcuts.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {shortcuts.map(({ to, label, Icon }) => <Link key={to} to={to} className="btn-ghost"><Icon size={17} /> {label}</Link>)}
        </div>
      )}
      {openId && <OrderDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </>
  );
}
