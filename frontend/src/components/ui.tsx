import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-noir/50" onClick={onClose} />
      <div className={`relative max-h-[calc(100%-24px)] w-full overflow-auto rounded-[14px] bg-cotton p-7 shadow-2xl animate-[rise_.25s_ease] ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <button className="iconbtn absolute right-4 top-4" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h3 className="display mb-1 pr-12 text-[28px]">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="panel px-5 py-14 text-center">
      <div className="mx-auto mb-3.5 grid h-16 w-16 place-items-center rounded-xl bg-tint text-cherry">{icon}</div>
      <h3 className="display text-[22px]">{title}</h3>
      <p className="mx-auto mb-4 mt-1 max-w-md text-ink-2">{text}</p>
      {action}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-ink-2">Page {page} of {pages}</span>
      <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export const Spinner = () => <div className="mx-auto my-16 h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-cherry" aria-label="Loading" />;
