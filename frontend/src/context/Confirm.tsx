import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Modal } from '../components/ui';

type Ask = { title: string; text: string; yes?: string; no?: string; danger?: boolean };
const ConfirmCtx = createContext<(a: Ask) => Promise<boolean>>(async () => false);

/** our own "Are you sure?" box instead of the browser's localhost alert. Use: if (await ask({...})) ... */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState<Ask | null>(null);
  const done = useRef<(v: boolean) => void>(() => {});

  const ask = useCallback((a: Ask) => new Promise<boolean>((resolve) => {
    done.current = resolve;
    setQ(a);
  }), []);
  const answer = (v: boolean) => {
    setQ(null);
    done.current(v);
  };

  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {q && (
        <Modal title={q.title} onClose={() => answer(false)}>
          <div className="mt-2 flex gap-3">
            {q.danger && <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-cherry-soft text-cherry"><TriangleAlert size={19} /></span>}
            <p className="text-ink-2">{q.text}</p>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button className="btn-ghost" onClick={() => answer(false)}>{q.no || 'Keep it'}</button>
            <button className="btn" autoFocus onClick={() => answer(true)}>{q.yes || 'Yes'}</button>
          </div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
