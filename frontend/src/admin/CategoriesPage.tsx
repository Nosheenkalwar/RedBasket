import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { iconForCategory } from '../lib/categoryLook';
import { emojiFor } from '../lib/format';
import { staffApi } from '../lib/api';
import { useForm } from '../lib/useForm';
import { rules } from '../lib/validate';
import { useToast } from '../context/Toast';
import { Field } from '../components/fields';
import { useConfirm } from '../context/Confirm';
import { Modal } from '../components/ui';

type Sub = { id: number; name: string; isActive: boolean; products: number; activeProducts: number };
type Cat = { id: number; name: string; isActive: boolean; subcategories: Sub[] };
type Editing = { mode: 'add'; parent: Cat | null } | { mode: 'rename'; item: { id: number; name: string }; isSub: boolean };

export default function CategoriesPage() {
  const toast = useToast();
  const ask = useConfirm();
  const [tree, setTree] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);

  useEffect(() => {
    staffApi<Cat[]>('/admin/categories').then(setTree).catch((e) => toast(e.message, true));
  }, [toast]);

  const run = async (path: string, method: string, body?: unknown, done?: string) => {
    try {
      setTree(await staffApi<Cat[]>(path, { method, body }));
      if (done) toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message, true);
      return false;
    }
  };
  const toggle = (id: number, name: string, isActive: boolean) =>
    run(`/admin/categories/${id}`, 'PATCH', { isActive: !isActive }, `${name} is ${isActive ? 'hidden from the store' : 'published'}`);
  const remove = async (id: number, name: string) => (await ask({ title: `Delete ${name}?`, text: 'This cannot be undone. If it has products, hide it instead.', yes: 'Delete', danger: true })) && run(`/admin/categories/${id}`, 'DELETE', undefined, `${name} deleted`);

  const txt = 'rounded-md border-[1.5px] border-line bg-cotton px-2.5 py-1 text-[12.5px] font-semibold transition hover:border-noir';
  const actions = (item: Cat | Sub) => (
    <div className="flex flex-none gap-1.5">
      <button className={txt} onClick={() => setEditing({ mode: 'rename', item, isSub: !('subcategories' in item) })}>Rename</button>
      <button className={`${txt} ${item.isActive ? '' : 'border-ok text-ok'}`} onClick={() => toggle(item.id, item.name, item.isActive)}>{item.isActive ? 'Hide' : 'Publish'}</button>
      <button className={`${txt} text-cherry hover:border-cherry`} onClick={() => remove(item.id, item.name)}>Delete</button>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-ink-2">Hiding a category takes it and all its products off the store until you publish it again; stock is not touched. A category that has products can be hidden but not deleted.</p>
        <button className="btn btn-sm" onClick={() => setEditing({ mode: 'add', parent: null })}><Plus size={15} /> Add category</button>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        {tree.map((c) => (
          <section key={c.id} className={`panel p-4 ${c.isActive ? '' : 'opacity-60'}`}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h3 className="display flex items-center gap-2.5 text-xl"><CatIcon name={c.name} />{c.name}<span className={`pill font-sans ${c.isActive ? 'bg-ok-soft text-ok' : ''}`}>{c.isActive ? 'Published' : 'Hidden'}</span></h3>
              {actions(c)}
            </div>
            <ul className="divide-y divide-dashed divide-line border-y border-dashed border-line">
              {c.subcategories.map((s) => (
                <li key={s.id} className={`flex items-center justify-between gap-2 py-2 ${s.isActive ? '' : 'opacity-55'}`}>
                  <span className="text-sm"><b className="font-semibold">{s.name}</b> <span className="text-ink-2">{s.activeProducts} active of {s.products}</span>{!s.isActive && <span className="pill ml-1.5">Hidden</span>}{!c.isActive && s.isActive && <span className="block text-xs text-ink-3">Hidden with {c.name}</span>}</span>
                  {actions(s)}
                </li>
              ))}
              {c.subcategories.length === 0 && <li className="py-2 text-sm text-ink-3">No sub-categories yet.</li>}
            </ul>
            <button className="link mt-3 text-sm" onClick={() => setEditing({ mode: 'add', parent: c })}>+ Add sub-category</button>
          </section>
        ))}
      </div>
      {editing && (
        <NameForm editing={editing} onClose={() => setEditing(null)} onSave={async (name) => {
          const ok = editing.mode === 'add'
            ? await run('/admin/categories', 'POST', { name, parentId: editing.parent?.id }, `${name} added`)
            : await run(`/admin/categories/${editing.item.id}`, 'PATCH', { name }, 'Name updated');
          if (ok) setEditing(null);
        }} />
      )}
    </>
  );
}

function NameForm({ editing, onClose, onSave }: { editing: Editing; onClose: () => void; onSave: (name: string) => void }) {
  const form = useForm({ name: editing.mode === 'rename' ? editing.item.name : '' }, { name: rules.length('name', 2, 40) });
  const title = editing.mode === 'rename' ? 'Rename' : editing.parent ? `Add sub-category to ${editing.parent.name}` : 'Add category';
  const isSub = editing.mode === 'add' ? !!editing.parent : editing.isSub;
  return (
    <Modal title={title} onClose={onClose}>
      <form className="mt-3 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); form.validate() && onSave(form.values.name.trim()); }} noValidate>
        <Field label="Name" autoFocus value={form.values.name} onChange={(e) => form.set('name', e.target.value.slice(0, 40))} error={form.error('name')} hint={`${form.values.name.length}/40`} />
        {form.values.name.trim().length > 1 && (
          <p className="flex items-center gap-2.5 rounded-lg bg-tint px-3 py-2 text-sm">
            {isSub ? <span className="text-2xl">{emojiFor(form.values.name)}</span> : <CatIcon name={form.values.name} />}
            {isSub ? 'Products without a photo will show this picture.' : 'This icon will show in the store menu.'}
          </p>
        )}
        <div className="flex gap-2.5"><button className="btn">Save</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

/** the icon picked from the category name, so "Books" gets a book */
function CatIcon({ name }: { name: string }) {
  const Icon = iconForCategory(name);
  return <span className="grid h-9 w-9 flex-none place-items-center rounded-full border-[1.5px] border-line bg-cotton text-cherry"><Icon size={18} /></span>;
}
