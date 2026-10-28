import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BadgeCheck, Heart, MapPin, Package, Pencil, Plus, Star, Trash2, User } from 'lucide-react';
import { api } from '../lib/api';
import { useForm } from '../lib/useForm';
import { onlyName, rules } from '../lib/validate';
import type { Address, Customer } from '../lib/types';
import { useAuth } from '../context/Auth';
import { useToast } from '../context/Toast';
import { Field } from '../components/fields';
import { Empty } from '../components/ui';
import AddressForm from '../components/AddressForm';
import { useConfirm } from '../context/Confirm';
import MyOrders from './MyOrders';

export default function Account() {
  const { customer, openAuth } = useAuth();
  const { pathname } = useLocation();

  if (!customer) return (
    <div className="mx-auto max-w-xl px-5 pt-10">
      <Empty icon={<User size={30} />} title="Sign in to see your account" text="Your profile and saved addresses live here. Sign in with your phone, no password needed."
        action={<div className="flex justify-center gap-2.5"><button className="btn" onClick={() => openAuth('login')}>Sign in</button><button className="btn-ghost" onClick={() => openAuth('signup')}>Register</button></div>} />
    </div>
  );

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 whitespace-nowrap rounded-lg p-2.5 font-semibold ${isActive ? 'bg-noir text-cotton' : 'text-ink-2 hover:bg-tint hover:text-noir'}`;

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-7 px-5 pt-6 lg:grid-cols-[250px_1fr]">
      <aside className="panel p-2.5 lg:sticky lg:top-44">
        <div className="mb-1.5 hidden items-center gap-3 border-b border-dashed border-line px-2 pb-3.5 pt-1 lg:flex">
          <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-full bg-cherry font-display text-[22px] text-cotton">{customer.firstName[0]}{customer.lastName[0]}</span>
          <div><b className="block leading-tight">{customer.firstName} {customer.lastName}</b><small className="text-ink-2">{customer.phoneNumber.replace('+92', '+92 ')}</small></div>
        </div>
        <nav className="flex gap-0.5 overflow-x-auto lg:flex-col">
          <NavLink end to="/account" className={link}><User size={18} /> Profile details</NavLink>
          <NavLink to="/account/orders" className={link}><Package size={18} /> My orders</NavLink>
          <NavLink to="/account/addresses" className={link}><MapPin size={18} /> Addresses</NavLink>
          <NavLink to="/wishlist" className={link}><Heart size={18} /> Wishlist</NavLink>
        </nav>
      </aside>
      <div className="min-w-0">{pathname.endsWith('/addresses') ? <Addresses /> : pathname.startsWith('/account/orders') ? <MyOrders /> : <Profile customer={customer} />}</div>
    </div>
  );
}

function Profile({ customer }: { customer: Customer }) {
  const { setCustomer } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const form = useForm({ firstName: customer.firstName, lastName: customer.lastName, email: customer.email || '' },
    { firstName: rules.name('first name'), lastName: rules.name('last name'), email: rules.email(true) });
  const v = form.values;
  const changed = v.firstName !== customer.firstName || v.lastName !== customer.lastName || v.email !== (customer.email || '');

  const save = async () => {
    if (!form.validate()) return;
    setSaving(true);
    try {
      setCustomer(await api<Customer>('/me', { method: 'PATCH', body: v }));
      toast('Profile saved');
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="display text-[clamp(28px,3.6vw,38px)]">Profile details</h1>
      <p className="mb-4 mt-1 text-ink-2">Your name shows on receipts and to the rider.</p>
      <form className="panel flex max-w-2xl flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" value={v.firstName} onChange={(e) => form.set('firstName', onlyName(e.target.value))} error={form.error('firstName')} />
          <Field label="Last name" value={v.lastName} onChange={(e) => form.set('lastName', onlyName(e.target.value))} error={form.error('lastName')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">Mobile number</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="input w-auto flex-1 bg-tint">{customer.phoneNumber.replace('+92', '+92 ')}</span>
            <span className="pill bg-ok-soft text-ok"><BadgeCheck size={13} /> Verified</span>
          </div>
          <span className="text-xs text-ink-3">Your phone number is your login, so it cannot be changed here.</span>
        </div>
        <Field label="Email (optional)" type="email" placeholder="you@example.com" value={v.email} onChange={(e) => form.set('email', e.target.value.trim())} error={form.error('email')} />
        <div><button className="btn" disabled={!changed || saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </>
  );
}

function Addresses() {
  const toast = useToast();
  const ask = useConfirm();
  const [list, setList] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);

  useEffect(() => {
    api<Address[]>('/me/addresses').then(setList).catch((e) => toast(e.message, true));
  }, [toast]);

  const run = async (path: string, method: string, body?: unknown, done?: string) => {
    try {
      setList(await api<Address[]>(path, { method, body }));
      if (done) toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message, true);
      return false;
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="display text-[clamp(28px,3.6vw,38px)]">Addresses</h1><p className="mt-1 text-ink-2">Where we deliver. Your default is picked at checkout.</p></div>
        <button className="btn btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> Add address</button>
      </div>
      {list && list.length === 0 && <Empty icon={<MapPin size={30} />} title="No saved addresses" text="Add your home or office address so checkout is quicker." action={<button className="btn" onClick={() => setEditing('new')}>Add address</button>} />}
      <div className="flex flex-col gap-2.5">
        {list?.map((a) => (
          <div key={a.id} className={`grid grid-cols-[40px_1fr] items-start gap-3 rounded-xl border-[1.5px] bg-card p-4 sm:grid-cols-[40px_1fr_auto] ${a.isDefault ? 'border-noir' : 'border-line'}`}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-tint text-cherry"><MapPin size={18} /></span>
            <div><b className="flex items-center gap-2">{a.label}{a.isDefault && <span className="pill bg-noir text-cotton">Default</span>}</b>
              <span className="text-sm text-ink-2">{a.addressLine}, {a.area}, {a.city}</span></div>
            <div className="col-span-2 flex flex-wrap justify-end gap-1.5 sm:col-span-1">
              {!a.isDefault && <button className="btn-ghost btn-sm" onClick={() => run(`/me/addresses/${a.id}/default`, 'POST', undefined, 'Default address updated')}><Star size={14} /> Make default</button>}
              <button className="btn-ghost btn-sm" onClick={() => setEditing(a)}><Pencil size={14} /> Edit</button>
              <button className="btn-ghost btn-sm" onClick={async () => (await ask({ title: 'Delete this address?', text: `"${a.label}" will be removed from your saved addresses.`, yes: 'Delete', danger: true })) && run(`/me/addresses/${a.id}`, 'DELETE', undefined, 'Address removed')} aria-label={`Delete ${a.label}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <AddressForm address={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSave={async (body) => (await run(editing === 'new' ? '/me/addresses' : `/me/addresses/${editing.id}`, editing === 'new' ? 'POST' : 'PUT', body, 'Address saved')) && setEditing(null)} />
      )}
    </>
  );
}
