import { ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Lock, MapPin, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { rs } from '../lib/format';
import { useForm } from '../lib/useForm';
import { onlyDigits } from '../lib/validate';
import type { Address, Order } from '../lib/types';
import { useAuth } from '../context/Auth';
import { useShop } from '../context/Shop';
import { useToast } from '../context/Toast';
import AddressForm, { AddressInput } from '../components/AddressForm';
import { ProductImage } from '../components/ProductBits';
import { Field } from '../components/fields';
import { Spinner } from '../components/ui';

type Quote = { subtotal: number; deliverable: boolean; reason?: string; fee: number; weightKg: number; courier: string; applied: string[]; total: number; slots: string[] };
type Pay = 'cod' | 'card_test';

// card details are only checked in the browser for the test checkout; they are never sent or stored (REQ-DB-7)
const luhn = (n: string) => n.split('').reverse().map(Number).reduce((a, d, i) => a + (i % 2 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d), 0) % 10 === 0;
const expiryOk = (v: string) => {
  const [m, y] = v.split('/').map(Number);
  if (!m || m > 12 || y === undefined || v.length < 5) return false;
  const end = new Date(2000 + y, m, 1);
  return end > new Date();
};

export default function Checkout() {
  const { customer, ready } = useAuth();
  const { cart, reloadCart } = useShop();
  const toast = useToast();
  const nav = useNavigate();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [slot, setSlot] = useState('');
  const [pay, setPay] = useState<Pay>('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const card = useForm({ number: '', name: '', expiry: '', cvv: '' }, {
    number: (v) => (v.length < 16 ? 'Enter the 16-digit card number.' : luhn(v) ? '' : 'This card number is not valid. Try 4242 4242 4242 4242.'),
    name: (v) => (v.trim().length < 3 ? 'Enter the name on the card.' : ''),
    expiry: (v) => (expiryOk(v) ? '' : 'Enter a future date as MM/YY.'),
    cvv: (v) => (v.length === 3 ? '' : 'Enter the 3 digits on the back.'),
  });

  useEffect(() => {
    if (!customer) return;
    api<Address[]>('/me/addresses').then((list) => {
      setAddresses(list);
      setAddressId((id) => id ?? list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
    }).catch((e) => toast(e.message, true));
  }, [customer, toast]);

  // the shipping rules run on the server every time the address or cart changes
  useEffect(() => {
    if (!addressId || !cart.count) return setQuote(null);
    api<Quote>('/checkout/quote', { method: 'POST', body: { addressId } }).then((q) => {
      setQuote(q);
      setSlot((s) => (q.slots.includes(s) ? s : q.slots[0] || ''));
    }).catch((e) => setError(e.message));
  }, [addressId, cart.subtotal, cart.count]);

  if (!ready) return <Spinner />;
  if (!customer) return <Navigate to="/" replace />;
  if (!cart.count) return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      <h1 className="display text-4xl">Your cart is empty</h1>
      <p className="mb-5 mt-2 text-ink-2">Add a few things before checking out.</p>
      <Link to="/" className="btn">Back to the store</Link>
    </div>
  );

  const saveAddress = async (body: AddressInput) => {
    try {
      const list = await api<Address[]>('/me/addresses', { method: 'POST', body });
      setAddresses(list);
      setAddressId(Math.max(...list.map((a) => a.id)));
      setAdding(false);
      toast('Address saved');
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  const place = async () => {
    setError('');
    if (!addressId) return setError('Add a delivery address first.');
    if (!quote?.deliverable) return setError(quote?.reason || 'We cannot deliver to this address.');
    if (!slot) return setError('Choose a delivery slot.');
    if (pay === 'card_test' && !card.validate()) return setError('Check the card details.');
    setPlacing(true);
    try {
      const order = await api<Order>('/orders', { method: 'POST', body: { addressId, deliverySlot: slot, paymentMethod: pay, notes: notes || undefined } });
      await reloadCart();
      nav(`/order-placed/${order.orderNumber}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      reloadCart(); // stock may have changed, refresh the notes in the cart
    } finally {
      setPlacing(false);
    }
  };

  const choice = (on: boolean) => `flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-3.5 transition ${on ? 'border-cherry bg-[#F6E9E4]' : 'border-line bg-card hover:border-noir'}`;
  const c = card.values;

  return (
    <div className="mx-auto max-w-7xl px-5">
      <nav className="flex gap-2 pb-1.5 pt-5 text-[13.5px] text-ink-2"><Link to="/" className="font-semibold text-noir">Home</Link> / <span>Checkout</span></nav>
      <h1 className="display mb-5 text-[clamp(30px,4vw,42px)]">Checkout</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_390px]">
        <div className="flex flex-col gap-4">
          <Step n={1} title="Delivery address">
            {addresses === null ? <Spinner /> : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a.id} className={choice(addressId === a.id)}>
                    <input type="radio" name="address" className="mt-1" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                    <span className="min-w-0"><b className="flex items-center gap-2">{a.label}{a.isDefault && <span className="pill">Default</span>}</b>
                      <span className="block text-sm text-ink-2">{a.addressLine}, {a.area}, {a.city}</span></span>
                  </label>
                ))}
                <button type="button" onClick={() => setAdding(true)} className="flex min-h-[78px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line font-semibold text-cherry hover:border-cherry">
                  <Plus size={17} /> Add a new address
                </button>
              </div>
            )}
            {quote && !quote.deliverable && <p className="mt-3 rounded-lg bg-[#F8ECE8] px-3 py-2 text-sm font-semibold text-cherry"><MapPin size={14} className="mr-1 inline" />{quote.reason}</p>}
          </Step>

          <Step n={2} title="Delivery slot">
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(quote?.slots || []).map((s) => (
                <label key={s} className={choice(slot === s)}>
                  <input type="radio" name="slot" className="mt-1" checked={slot === s} onChange={() => setSlot(s)} />
                  <span><b className="block">{s.split(', ')[1]}</b><span className="text-sm text-ink-2">{s.split(', ')[0]}</span></span>
                </label>
              ))}
            </div>
            {quote && !quote.slots.some((s) => s.startsWith('Today')) && <p className="mt-2.5 text-[13px] text-ink-2">Same-day slots close at 4 PM. Tomorrow's slots are open.</p>}
            <label className="mt-3.5 flex flex-col gap-1.5"><span className="label">Note for the rider (optional)</span>
              <input className="input" maxLength={200} placeholder="Ring the bell twice, gate is on the left" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </Step>

          <Step n={3} title="Payment">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className={choice(pay === 'cod')}><input type="radio" name="pay" className="mt-1" checked={pay === 'cod'} onChange={() => setPay('cod')} />
                <span><b className="flex items-center gap-2"><Banknote size={17} /> Cash on delivery</b><span className="text-sm text-ink-2">Pay the rider when your order arrives</span></span></label>
              
             {/* <label className={choice(pay === 'card_test')}><input type="radio" name="pay" className="mt-1" checked={pay === 'card_test'} onChange={() => setPay('card_test')} />
                <span><b className="flex items-center gap-2"><CreditCard size={17} /> Debit or credit card</b><span className="text-sm text-ink-2">Test payment, no real money is charged</span></span></label>*/}
            </div>
            {pay === 'card_test' && (
              <div className="mt-3.5 grid gap-3 rounded-xl border-[1.5px] border-line bg-cotton p-4 sm:grid-cols-2">
                <Field className="sm:col-span-2" label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                  value={c.number.replace(/(\d{4})(?=\d)/g, '$1 ')} onChange={(e) => card.set('number', onlyDigits(e.target.value, 16))} error={card.error('number')} good={card.isValid('number')} />
                <Field className="sm:col-span-2" label="Name on card" autoComplete="cc-name" value={c.name} onChange={(e) => card.set('name', e.target.value.replace(/[^A-Za-z .]/g, '').slice(0, 40))} error={card.error('name')} />
                <Field label="Expiry (MM/YY)" inputMode="numeric" autoComplete="cc-exp" placeholder="08/28" value={c.expiry}
                  onChange={(e) => { const d = onlyDigits(e.target.value, 4); card.set('expiry', d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} error={card.error('expiry')} />
                <Field label="CVV" inputMode="numeric" autoComplete="cc-csc" type="password" placeholder="123" value={c.cvv} onChange={(e) => card.set('cvv', onlyDigits(e.target.value, 3))} error={card.error('cvv')} />
                <p className="flex items-center gap-1.5 text-xs text-ink-3 sm:col-span-2"><Lock size={12} /> Card details stay in your browser and are never saved.</p>
              </div>
            )}
          </Step>
        </div>

        <aside className="panel lg:sticky lg:top-44">
          <h3 className="display mb-3 text-2xl">Order summary</h3>
          <div className="max-h-72 overflow-auto">
            {cart.items.map(({ product: p, quantity, note }) => (
              <div key={p.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-2.5 text-sm">
                <span className="h-11 w-11 rounded-lg border border-line bg-white p-1 text-2xl"><ProductImage p={p} /></span>
                <span className="min-w-0"><b className="block truncate">{p.name}</b><small className="text-ink-2">{quantity} × {rs(p.price)}</small>{note && <small className="block font-semibold text-warn">{note}</small>}</span>
                <b className="tabular-nums">{rs(p.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[14.5px]">
            <Line label="Subtotal" value={rs(cart.subtotal)} />
            <Line label="Delivery" value={!quote ? '…' : !quote.deliverable ? 'Not available' : quote.fee ? rs(quote.fee) : 'Free'} />
          </div>
          {quote?.deliverable && (
            <ul className="mt-2.5 space-y-1 rounded-lg bg-tint px-3 py-2.5 text-[12.5px] text-ink-2">
              {quote.applied.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold"><span>Total</span><span className="tabular-nums">{quote?.deliverable ? rs(quote.total) : rs(cart.subtotal)}</span></div>
          {error && <p className="mt-2 text-sm font-semibold text-cherry">{error}</p>}
          <button className="btn mt-3.5 w-full py-3.5 text-[15px]" onClick={place} disabled={placing || !quote?.deliverable || !slot}>
            {placing ? 'Placing your order…' : `Place order${quote?.deliverable ? `, ${rs(quote.total)}` : ''}`}
          </button>
          <p className="mt-2.5 text-center text-xs text-ink-3">By placing the order you agree to our <Link to="/terms" className="underline">Terms of Use</Link>.</p>
        </aside>
      </div>
      {adding && <AddressForm address={null} onClose={() => setAdding(false)} onSave={saveAddress} />}
    </div>
  );
}

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="panel">
    <h3 className="mb-3.5 flex items-center gap-2.5 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-cherry text-sm text-cotton">{n}</span>{title}</h3>
    {children}
  </section>
);
const Line = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between"><span>{label}</span><span className="tabular-nums">{value}</span></div>;
