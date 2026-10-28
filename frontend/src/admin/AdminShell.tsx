import { ReactNode, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Boxes, FolderTree, History, LayoutDashboard, LogOut, Package, ShoppingBag, Users, LucideIcon } from 'lucide-react';
import { staffApi } from '../lib/api';
import { ROLE_LABEL } from '../lib/format';
import { useForm } from '../lib/useForm';
import { rules } from '../lib/validate';
import type { Role, StaffUser } from '../lib/types';
import { useStaff } from '../context/Staff';
import { useToast } from '../context/Toast';
import { Field } from '../components/fields';
import { Logo } from '../components/Header';
import { Spinner } from '../components/ui';

type NavItem = { to: string; label: string; Icon: LucideIcon; roles?: Role[] };
// Super Admin can open everything; other roles only see their own pages (REQ-SL-4)
export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', Icon: ShoppingBag, roles: ['SALES_STAFF', 'SUB_ADMIN'] },
  { to: '/admin/staff', label: 'Staff and roles', Icon: Users, roles: [] },
  { to: '/admin/activity', label: 'Activity log', Icon: History, roles: [] },
  { to: '/admin/categories', label: 'Categories', Icon: FolderTree, roles: ['SUB_ADMIN'] },
  { to: '/admin/products', label: 'Products', Icon: Package, roles: ['SUB_ADMIN'] },
  { to: '/admin/inventory', label: 'Inventory', Icon: Boxes, roles: ['INVENTORY_STAFF'] },
];
export const canOpen = (role: Role, item: NavItem) => role === 'SUPER_ADMIN' || !item.roles || item.roles.includes(role);

export function AdminLayout() {
  const { staff, ready, signOut } = useStaff();
  const { pathname } = useLocation();
  if (!ready) return <Spinner />;
  if (!staff) return <Navigate to="/admin/login" replace />;
  if (staff.mustChangePassword) return <ChangePassword forced />;

  const nav = ADMIN_NAV.filter((n) => canOpen(staff.role, n));
  const current = ADMIN_NAV.find((n) => n.to === pathname);
  if (current && !canOpen(staff.role, current)) return <Navigate to="/admin" replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
      <aside className="flex gap-1.5 overflow-x-auto bg-noir p-3 text-cotton lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:p-4">
        <div className="hidden px-2.5 pb-4 lg:block"><Logo dark /></div>
        <div className="mx-2.5 mb-3 hidden text-xs opacity-70 lg:block">{ROLE_LABEL[staff.role]}</div>
        {nav.map(({ to, label, Icon }) => (
          <NavLink key={to} end to={to} className={({ isActive }) =>
            `flex flex-none items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-[14.5px] font-semibold ${isActive ? 'bg-cotton text-noir' : 'opacity-80 hover:bg-cotton/10 hover:opacity-100'}`}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <div className="hidden flex-1 lg:block" />
        <button onClick={signOut} className="flex flex-none items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-semibold opacity-80 hover:bg-cotton/10 hover:opacity-100"><LogOut size={19} /> Sign out</button>
      </aside>
      <main className="min-w-0 pb-16">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cotton px-7 py-4">
          <h1 className="display text-[28px]">{current?.label || 'Dashboard'}</h1>
          <span className="flex items-center gap-2.5 text-sm">
            <span className="text-right leading-tight"><b className="block">{staff.fullName}</b><small className="text-ink-2">{ROLE_LABEL[staff.role]}</small></span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-cherry font-bold text-cotton">{staff.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
          </span>
        </div>
        <div className="flex flex-col gap-5 p-7 max-sm:p-4"><Outlet /></div>
      </main>
    </div>
  );
}

function Split({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between gap-7 bg-noir p-12 text-cotton lg:flex">
        <div className="self-start"><Logo dark /></div>
        <div><h2 className="display max-w-[13ch] text-[clamp(34px,4vw,52px)] leading-[1.05]">Fresh shelves, full baskets, happy Karachi.</h2>
          <p className="mt-3.5 max-w-[40ch] opacity-75">Staff portal for orders, products, stock and the people who run them.</p></div>
        <span className="text-[13px] opacity-60">Staff and admin access only</span>
      </div>
      <div className="grid place-items-center px-5 py-8">{children}</div>
    </div>
  );
}

export function AdminLogin() {
  const { staff, signIn } = useStaff();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useForm({ email: '', password: '' }, { email: rules.email(false), password: rules.required('password') });
  if (staff) return <Navigate to="/admin" replace />;

  const submit = async () => {
    setError('');
    if (!form.validate()) return;
    setBusy(true);
    try {
      const r = await staffApi<{ token: string; staff: StaffUser }>('/staff-auth/login', { method: 'POST', body: form.values });
      signIn(r.token, r.staff);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Split>
      <form className="flex w-full max-w-[400px] flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <h1 className="display text-4xl">Staff sign in</h1>
        <p className="-mt-1.5 text-ink-2">Use your work email and password.</p>
        <Field label="Email" type="email" autoComplete="username" autoFocus value={form.values.email} onChange={(e) => form.set('email', e.target.value.trim())} error={form.error('email')} />
        <Field label="Password" type="password" autoComplete="current-password" value={form.values.password} onChange={(e) => form.set('password', e.target.value)} error={form.error('password')} />
        {error && <p className="text-sm font-semibold text-cherry">{error}</p>}
        <button className="btn w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-[12.5px] text-ink-2">Forgot your password? Ask the Super Admin to reset it.</p>
      </form>
    </Split>
  );
}

/** new staff must replace the temporary password before using the panel (REQ-SL-6) */
export function ChangePassword({ forced }: { forced?: boolean }) {
  const { setStaff, signOut } = useStaff();
  const toast = useToast();
  const [error, setError] = useState('');
  const form = useForm({ currentPassword: '', newPassword: '', confirm: '' }, {
    currentPassword: rules.required('current password'),
    newPassword: (v, all) => rules.password(v) || (v === all.currentPassword ? 'Pick a password different from the temporary one.' : ''),
    confirm: (v, all) => (v === all.newPassword ? '' : 'The two passwords do not match.'),
  });
  const v = form.values;

  const submit = async () => {
    setError('');
    if (!form.validate()) return;
    try {
      setStaff(await staffApi<StaffUser>('/staff-auth/change-password', { method: 'POST', body: { currentPassword: v.currentPassword, newPassword: v.newPassword } }));
      toast('Password changed');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Split>
      <form className="flex w-full max-w-[400px] flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <h1 className="display text-4xl">Set your password</h1>
        {forced && <p className="-mt-1.5 text-ink-2">You signed in with a temporary password. Choose your own to continue.</p>}
        <Field label="Temporary password" type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => form.set('currentPassword', e.target.value)} error={form.error('currentPassword')} />
        <Field label="New password" type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => form.set('newPassword', e.target.value)}
          error={form.error('newPassword')} good={!!v.newPassword && form.isValid('newPassword')} hint="At least 8 characters with letters and numbers." />
        <Field label="Repeat new password" type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => form.set('confirm', e.target.value)}
          error={form.error('confirm')} good={!!v.confirm && form.isValid('confirm')} />
        {error && <p className="text-sm font-semibold text-cherry">{error}</p>}
        <button className="btn w-full py-3">Save password</button>
        <button type="button" className="link text-sm" onClick={signOut}>Sign out</button>
      </form>
    </Split>
  );
}
