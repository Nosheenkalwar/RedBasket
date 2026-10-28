import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { rs } from '../lib/format';
import { useForm } from '../lib/useForm';
import { rules } from '../lib/validate';
import type { Address, Area } from '../lib/types';
import { Field } from './fields';
import { Modal } from './ui';
import Dropdown from './Dropdown';

export type AddressInput = { label: string; addressLine: string; area: string; city: string; isDefault: boolean };
let areaCache: Promise<Area[]> | null = null;

/** add / edit an address. City is fixed to Karachi and the area comes from the list we deliver to. */
export default function AddressForm({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: (body: AddressInput) => void }) {
  const [areas, setAreas] = useState<Area[]>([]);
  useEffect(() => {
    areaCache ??= api<Area[]>('/shipping/areas');
    areaCache.then(setAreas).catch(() => (areaCache = null));
  }, []);

  const known = (a: string) => areas.some((x) => x.name === a);
  const form = useForm<AddressInput>(
    { label: address?.label || '', addressLine: address?.addressLine || '', area: address?.area || '', city: 'Karachi', isDefault: address?.isDefault || false },
    { label: rules.length('label', 2, 30), addressLine: rules.length('address', 5, 150), area: (v) => (!v ? 'Choose your area.' : areas.length && !known(v) ? 'Choose your area from the list.' : '') },
  );
  const v = form.values;
  const picked = areas.find((a) => a.name === v.area);

  return (
    <Modal title={address ? 'Edit address' : 'Add address'} onClose={onClose}>
      <p className="mb-4 text-ink-2">We deliver anywhere in Karachi. Add a landmark so the rider finds you quickly.</p>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); form.validate() && onSave(v); }} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Label" placeholder="Home, Office" value={v.label} onChange={(e) => form.set('label', e.target.value.slice(0, 30))} error={form.error('label')} />
          <Dropdown label="Area" placeholder="Choose your area" searchable value={v.area} onChange={(a) => form.set('area', a)} error={form.error('area')}
            options={areas.map((a) => ({ value: a.name, label: a.name, hint: `${a.zoneName}, delivery Rs. ${a.fee}` }))} />
        </div>
        <Field label="House, street, landmark" placeholder="House 14, Street 7, near the bakery" value={v.addressLine} onChange={(e) => form.set('addressLine', e.target.value.slice(0, 150))} error={form.error('addressLine')} hint={`${v.addressLine.length}/150`} />
        <Field label="City" value="Karachi" readOnly className="opacity-80" hint="We deliver only within Karachi for now." />
        {picked && <p className="rounded-lg bg-tint px-3 py-2 text-[13px]">{picked.zoneName}: delivery {rs(picked.fee)}, free on orders over Rs. 3,000.</p>}
        <label className="flex items-center gap-2.5 text-sm text-ink-2"><input type="checkbox" checked={v.isDefault} onChange={(e) => form.set('isDefault', e.target.checked)} /> Use as my default address</label>
        <div className="mt-2 flex gap-2.5"><button className="btn">Save address</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
