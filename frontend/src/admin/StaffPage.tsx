import { useEffect, useState } from 'react';
import { Ban, Check, Copy, KeyRound, Pencil, Plus } from 'lucide-react';
import { staffApi, query } from '../lib/api';
import { dateTime, ROLE_LABEL } from '../lib/format';
import { useForm } from '../lib/useForm';
import { onlyName, rules } from '../lib/validate';
import type { Role } from '../lib/types';
import { useStaff } from '../context/Staff';
import { useToast } from '../context/Toast';
import { Field, PhoneField } from '../components/fields';
import Dropdown from '../components/Dropdown';
import { useConfirm } from '../context/Confirm';
import { Modal } from '../components/ui';

type Member = { id: number; fullName: string; email: string; phone: string | null; role: Role; status: 'active' | 'blocked'; lastLoginAt: string | null; mustChangePassword: boolean };
const ASSIGNABLE: Role[] = ['SUB_ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'];

export default function StaffPage() {
  const { staff: me } = useStaff();
  const toast = useToast();
  const ask = useConfirm();
  const [list, setList] = useState<Member[]>([]);
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const [secret, setSecret] = useState<{ name: string; email: string; password: string } | null>(null);

  const load = () => staffApi<Member[]>('/admin/staff' + query(filters)).then(setList).catch((e) => toast(e.message, true));
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const act = async (path: string, done: string) => {
    try {
      const r = await staffApi<{ tempPassword?: string; staff?: Member } & Partial<Member>>(path, { method: 'POST' });
      if (r.tempPassword && r.staff) setSecret({ name: r.staff.fullName, email: r.staff.email, password: r.tempPassword });
      toast(done);
      load();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <input className="input max-w-xs" type="search" placeholder="Search name or email" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} aria-label="Search staff" />
        <Dropdown className="w-48" ariaLabel="Filter by role" value={filters.role} onChange={(role) => setFilters({ ...filters, role })}
          options={[{ value: '', label: 'All roles' }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))]} />
        <Dropdown className="w-44" ariaLabel="Filter by status" value={filters.status} onChange={(status) => setFilters({ ...filters, status })}
          options={[{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} />
        <button className="btn btn-sm ml-auto" onClick={() => setEditing('new')}><Plus size={15} /> Add staff member</button>
      </div>

      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="th">Staff member</th><th className="th">Role</th><th className="th">Phone</th><th className="th">Status</th><th className="th">Last login</th><th className="th text-right">Actions</th></tr></thead>
          <tbody>
            {list.map((s) => {
              const isMe = s.id === me?.id, isSuper = s.role === 'SUPER_ADMIN';
              return (
                <tr key={s.id} className={s.status === 'blocked' ? 'opacity-60' : ''}>
                  <td className="td"><b className="block">{s.fullName}{isMe && <span className="ml-1.5 text-xs font-normal text-ink-3">(you)</span>}</b><small className="text-ink-2">{s.email}</small></td>
                  <td className="td"><span className={`pill ${isSuper ? 'bg-noir text-cotton' : ''}`}>{ROLE_LABEL[s.role]}</span></td>
                  <td className="td tabular-nums">{s.phone ? `+92 ${s.phone}` : '–'}</td>
                  <td className="td"><span className={`pill ${s.status === 'active' ? 'bg-ok-soft text-ok' : 'bg-cherry text-cotton'}`}>{s.status === 'active' ? 'Active' : 'Blocked'}</span>
                    {s.mustChangePassword && <small className="block text-ink-3">Temporary password</small>}</td>
                  <td className="td whitespace-nowrap tabular-nums">{s.lastLoginAt ? dateTime(s.lastLoginAt) : 'Never'}</td>
                  <td className="td">
                    {!isSuper && (
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost btn-sm" onClick={() => setEditing(s)}><Pencil size={14} /> Edit</button>
                        <button className="iconbtn h-9 w-9" title="Reset password" aria-label={`Reset password for ${s.fullName}`}
                          onClick={async () => (await ask({ title: 'Reset password?', text: `${s.fullName} gets a new temporary password and the old one stops working.`, yes: 'Reset password' })) && act(`/admin/staff/${s.id}/reset-password`, 'Password reset')}><KeyRound size={16} /></button>
                        {s.status === 'active'
                          ? <button className="iconbtn h-9 w-9 text-cherry" title="Block" aria-label={`Block ${s.fullName}`} onClick={async () => (await ask({ title: `Block ${s.fullName}?`, text: 'They will be signed out straight away and cannot log in until you unblock them.', yes: 'Block', danger: true })) && act(`/admin/staff/${s.id}/block`, `${s.fullName} blocked`)}><Ban size={16} /></button>
                          : <button className="iconbtn h-9 w-9 text-ok" title="Unblock" aria-label={`Unblock ${s.fullName}`} onClick={() => act(`/admin/staff/${s.id}/unblock`, `${s.fullName} can sign in again`)}><Check size={16} /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="td py-8 text-center text-ink-2">No staff match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <StaffForm member={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSaved={(r) => { setEditing(null); load(); if (r) setSecret(r); }} />
      )}
      {secret && (
        <Modal title="Temporary password" onClose={() => setSecret(null)}>
          <p className="mb-3.5 text-ink-2">Share this with {secret.name}. It is shown only once. They sign in with {secret.email} and must choose their own password.</p>
          <div className="flex items-center justify-between gap-2.5 rounded-lg border-[1.5px] border-dashed border-line bg-tint px-3 py-2.5 font-bold tracking-wider">
            {secret.password}
            <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(secret.password).then(() => toast('Copied'))}><Copy size={14} /> Copy</button>
          </div>
          <button className="btn mt-4" onClick={() => setSecret(null)}>Done</button>
        </Modal>
      )}
    </>
  );
}

function StaffForm({ member, onClose, onSaved }: { member: Member | null; onClose: () => void; onSaved: (secret?: { name: string; email: string; password: string }) => void }) {
  const [error, setError] = useState('');
  const form = useForm(
    { fullName: member?.fullName || '', email: member?.email || '', phone: member?.phone || '', role: (member?.role || '') as Role | '' },
    { fullName: rules.length('full name', 3, 60), email: rules.email(false), phone: (v) => (v ? rules.phone(v) : ''), role: (v) => (v ? '' : 'Choose a role.') },
  );
  const v = form.values;

  const save = async () => {
    setError('');
    if (!form.validate()) return;
    try {
      const body = { ...v, phone: v.phone || undefined };
      if (member) {
        await staffApi(`/admin/staff/${member.id}`, { method: 'PUT', body });
        onSaved();
      } else {
        const r = await staffApi<{ staff: Member; tempPassword: string }>('/admin/staff', { method: 'POST', body });
        onSaved({ name: r.staff.fullName, email: r.staff.email, password: r.tempPassword });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title={member ? 'Edit staff member' : 'Add staff member'} onClose={onClose}>
      <p className="mb-4 text-ink-2">{member ? 'Changes are saved to the activity log.' : 'They get a temporary password and must change it when they first sign in.'}</p>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <Field label="Full name" placeholder="Sara Khan" value={v.fullName} onChange={(e) => form.set('fullName', onlyName(e.target.value).slice(0, 60))} error={form.error('fullName')} />
        <Field label="Work email" type="email" placeholder="sara@redbasket.pk" value={v.email} onChange={(e) => form.set('email', e.target.value.trim())} error={form.error('email')} good={!!v.email && form.isValid('email')} />
        <PhoneField label="Phone (optional)" value={v.phone} onChange={(d) => form.set('phone', d)} error={form.error('phone')} />
        <Dropdown label="Role" placeholder="Choose a role" value={v.role} onChange={(r) => form.set('role', r as Role)} error={form.error('role')}
          options={ASSIGNABLE.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
        {error && <p className="text-sm font-semibold text-cherry">{error}</p>}
        <div className="mt-1 flex gap-2.5"><button className="btn">{member ? 'Save changes' : 'Add staff member'}</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
