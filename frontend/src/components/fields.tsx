import { InputHTMLAttributes, ReactNode, useState } from 'react';
import { Check } from 'lucide-react';
import { formatPhone, phoneDigits } from '../lib/validate';

type Base = { label: string; error?: string; hint?: ReactNode; good?: boolean };

export function Field({ label, error, hint, good, className = '', ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      <input {...input} className={`input ${error ? 'input-bad' : good ? 'input-good' : ''}`} aria-invalid={!!error} />
      <Message error={error} hint={hint} />
    </label>
  );
}

const Message = ({ error, hint }: { error?: string; hint?: ReactNode }) =>
  error ? <span className="text-[12.5px] font-semibold text-cherry">{error}</span> : hint ? <span className="text-xs text-ink-3">{hint}</span> : null;

/** Pakistani mobile number: flag, +92, digits only, stops at 10 digits, live counter and tick */
export function PhoneField({ value, onChange, error, label = 'Mobile number', autoFocus }: {
  value: string; onChange: (digits: string) => void; error?: string; label?: string; autoFocus?: boolean;
}) {
  const [shake, setShake] = useState(false);
  const good = /^3\d{9}$/.test(value);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      <div className={`flex overflow-hidden rounded-lg border-[1.5px] bg-card transition focus-within:border-cherry ${error ? 'border-cherry' : good ? 'border-ok' : 'border-line'} ${shake ? 'shake' : ''}`}
        onAnimationEnd={() => setShake(false)}>
        <span className="flex items-center gap-2 border-r-[1.5px] border-line bg-tint px-3 font-bold">
          <PkFlag /> +92
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 tracking-wide outline-none"
          inputMode="numeric" autoComplete="tel-national" placeholder="300 1234567" autoFocus={autoFocus}
          value={formatPhone(value)}
          onBeforeInput={(e) => {
            const data = (e.nativeEvent as InputEvent).data;
            const t = e.currentTarget;
            const selected = (t.selectionEnd ?? 0) - (t.selectionStart ?? 0);
            if (data && (/\D/.test(data) || (value.length >= 10 && !selected))) {
              e.preventDefault();
              setShake(true);
            }
          }}
          onChange={(e) => onChange(phoneDigits(e.target.value))}
        />
        <span className={`grid place-items-center px-3 text-ok transition ${good ? 'opacity-100' : 'opacity-0'}`}><Check size={16} /></span>
      </div>
      <div className="flex justify-between gap-2">
        <Message error={error} />
        <span className={`ml-auto text-xs tabular-nums ${good ? 'font-bold text-ok' : 'text-ink-3'}`}>{value.length}/10</span>
      </div>
    </label>
  );
}

const PkFlag = () => (
  <svg width="24" height="16" viewBox="0 0 30 20" role="img" aria-label="Pakistan" className="rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,.12)]">
    <rect width="30" height="20" fill="#01411C" /><rect width="7.5" height="20" fill="#fff" />
    <circle cx="18.6" cy="10" r="5.6" fill="#fff" /><circle cx="20.2" cy="8.7" r="4.9" fill="#01411C" />
    <path d="M22.6 5.4l.55 1.6 1.7.05-1.35 1 .5 1.6-1.4-.95-1.4.95.5-1.6-1.35-1 1.7-.05z" fill="#fff" />
  </svg>
);
