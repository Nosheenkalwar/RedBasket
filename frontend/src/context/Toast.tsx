import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';

type Toast = { id: number; text: string; bad?: boolean };
const ToastCtx = createContext<(text: string, bad?: boolean) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const show = useCallback((text: string, bad = false) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, bad }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2" role="status">
        {list.map((t) => (
          <div key={t.id} className={`flex animate-[rise_.25s_ease] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-cotton shadow-lg ${t.bad ? 'bg-cherry' : 'bg-noir'}`}>
            {t.bad ? <TriangleAlert size={16} /> : <Check size={16} />} {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
