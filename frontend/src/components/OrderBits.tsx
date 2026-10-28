import type { OrderStatus } from '../lib/types';

export const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Placed' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'On the way' }, { key: 'delivered', label: 'Delivered' },
];

const PILL: Record<OrderStatus, string> = {
  placed: 'bg-warn-soft text-warn', confirmed: 'bg-[#DCE4EA] text-[#3D5870]', packed: 'bg-[#E8DDE7] text-[#5E4460]',
  out_for_delivery: 'bg-cherry-soft text-cherry', delivered: 'bg-ok-soft text-ok', cancelled: 'bg-noir text-cotton',
};

export const StatusPill = ({ status, label }: { status: OrderStatus; label: string }) => <span className={`pill ${PILL[status]}`}>{label}</span>;

export const PAYMENT_LABEL = { cod: 'Cash on delivery', card_test: 'Card (test payment)' } as const;

/** five bars, filled up to the current step; the current one blinks */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;
  const at = STEPS.findIndex((s) => s.key === status);
  return (
    <div>
      <div className="grid grid-cols-5 gap-1">
        {STEPS.map((s, i) => <span key={s.key} className={`h-1.5 rounded-full ${i < at || status === 'delivered' ? 'bg-cherry' : i === at ? 'animate-pulse bg-cherry' : 'bg-line'}`} />)}
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-1 text-[11px] text-ink-3">{STEPS.map((s, i) => <span key={s.key} className={i <= at ? 'font-semibold text-noir' : ''}>{s.label}</span>)}</div>
    </div>
  );
}
