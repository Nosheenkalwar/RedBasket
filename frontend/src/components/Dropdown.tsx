import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export type Option = { value: string; label: string; group?: string; hint?: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  className?: string;
  ariaLabel?: string;
};

/** Our own select: styled like the rest of the site, works with mouse and keyboard, optional search and groups. */
export default function Dropdown({ value, onChange, options, placeholder = 'Choose', label, error, searchable, className = '', ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const shown = term ? options.filter((o) => o.label.toLowerCase().includes(term.toLowerCase())) : options;
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) {
      setTerm('');
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    root.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (o: Option) => {
    onChange(o.value);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); return setOpen(true); }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); shown[active] && pick(shown[active]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={root} className={`relative flex min-w-0 flex-col gap-1.5 ${className}`} onKeyDown={onKey}>
      {label && <span className="label">{label}</span>}
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={ariaLabel || label}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border-[1.5px] bg-card px-3 py-2.5 text-left transition
          ${error ? 'border-cherry bg-[#F8ECE8]' : open ? 'border-cherry' : 'border-line hover:border-noir'}`}>
        <span className={`truncate ${current ? 'font-semibold' : 'text-ink-3'}`}>{current?.label || placeholder}</span>
        <ChevronDown size={16} className={`flex-none text-ink-2 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {error && <span className="text-[12.5px] font-semibold text-cherry">{error}</span>}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border-[1.5px] border-line bg-white shadow-[0_18px_40px_-18px_rgba(27,23,22,.45)] animate-[rise_.15s_ease]">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Search size={15} className="text-ink-3" />
              <input autoFocus value={term} onChange={(e) => { setTerm(e.target.value); setActive(0); }} placeholder="Type to search" className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none" />
            </div>
          )}
          <ul id={listId} role="listbox" className="max-h-64 overflow-auto py-1.5">
            {shown.map((o, i) => (
              <li key={o.value} role="presentation">
                {o.group && o.group !== shown[i - 1]?.group && <div className="px-3.5 pb-1 pt-2.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-3">{o.group}</div>}
                <button type="button" role="option" aria-selected={o.value === value} data-i={i} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm ${i === active ? 'bg-cotton' : ''} ${o.value === value ? 'font-bold text-cherry' : ''}`}>
                  <span className="min-w-0"><span className="block truncate">{o.label}</span>{o.hint && <small className="block text-xs font-normal text-ink-3">{o.hint}</small>}</span>
                  {o.value === value && <Check size={15} className="flex-none" />}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3.5 py-3 text-sm text-ink-3">Nothing matches “{term}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
