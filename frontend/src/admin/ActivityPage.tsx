import { useEffect, useState } from 'react';
import { staffApi, query } from '../lib/api';
import { dateTime, ROLE_LABEL } from '../lib/format';
import type { Page, Role } from '../lib/types';
import { useToast } from '../context/Toast';
import Dropdown from '../components/Dropdown';
import { Pager } from '../components/ui';

type Log = { id: number; action: string; entityType: string; description: string; createdAt: string; staff: { id: number; fullName: string; role: Role } | null };
type Person = { id: number; fullName: string };

export default function ActivityPage() {
  const toast = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [f, setF] = useState({ staffId: '', from: '', to: '', q: '', page: 1 });
  const [data, setData] = useState<Page<Log> | null>(null);
  const dateError = f.from && f.to && f.from > f.to ? 'The start date is after the end date.' : '';

  useEffect(() => {
    staffApi<Person[]>('/admin/staff').then(setPeople).catch(() => {});
  }, []);

  useEffect(() => {
    if (dateError) return;
    const t = setTimeout(() => staffApi<Page<Log>>('/admin/activity' + query(f)).then(setData).catch((e) => toast(e.message, true)), 200);
    return () => clearTimeout(t);
  }, [f, dateError, toast]);

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v, page: 1 });

  return (
    <>
      <div className="flex flex-wrap items-end gap-2.5">
        <Dropdown className="w-52" label="Staff member" searchable value={f.staffId} onChange={(v) => set('staffId', v)}
          options={[{ value: '', label: 'Everyone' }, ...people.map((p) => ({ value: String(p.id), label: p.fullName }))]} />
        <label className="flex flex-col gap-1"><span className="label">From</span><input type="date" className={`input w-auto ${dateError ? 'input-bad' : ''}`} value={f.from} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('from', e.target.value)} /></label>
        <label className="flex flex-col gap-1"><span className="label">To</span><input type="date" className={`input w-auto ${dateError ? 'input-bad' : ''}`} value={f.to} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('to', e.target.value)} /></label>
        <label className="flex flex-1 flex-col gap-1"><span className="label">Search</span><input type="search" className="input" placeholder="Action or details" value={f.q} onChange={(e) => set('q', e.target.value)} /></label>
      </div>
      {dateError && <p className="-mt-2 text-sm font-semibold text-cherry">{dateError}</p>}

      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="th">When</th><th className="th">Staff member</th><th className="th">Action</th><th className="th">Details</th></tr></thead>
          <tbody>
            {data?.items.map((l) => (
              <tr key={l.id}>
                <td className="td whitespace-nowrap tabular-nums">{dateTime(l.createdAt)}</td>
                <td className="td whitespace-nowrap">{l.staff ? <><b>{l.staff.fullName}</b><small className="block text-ink-2">{ROLE_LABEL[l.staff.role]}</small></> : '–'}</td>
                <td className="td whitespace-nowrap"><span className="pill">{l.action}</span></td>
                <td className="td min-w-[260px] text-ink-2">{l.description}</td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={4} className="td py-8 text-center text-ink-2">No activity matches these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(page) => setF({ ...f, page })} />}
      <p className="text-xs text-ink-3">Only the Super Admin can see this log. Entries cannot be edited or deleted.</p>
    </>
  );
}
