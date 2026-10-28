import { useRef } from 'react';

/** six boxes: typing moves forward, backspace moves back, pasting a full code fills all */
export default function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  const put = (i: number, d: string) => {
    const next = digits.map((c, k) => (k === i ? d : c)).join('').replace(/\s+$/, '');
    onChange(next.replace(/ /g, ''));
  };

  return (
    <div className="my-4 flex gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i} ref={(el) => (boxes.current[i] = el)} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
          autoFocus={i === 0} autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={d.trim()}
          className={`h-14 w-full max-w-14 rounded-lg border-[1.5px] bg-card text-center text-2xl font-bold outline-none focus:border-cherry ${d.trim() ? 'border-noir' : 'border-line'}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            put(i, v || ' ');
            if (v) boxes.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim()) boxes.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const code = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (!code) return;
            e.preventDefault();
            onChange(code);
            boxes.current[Math.min(code.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
