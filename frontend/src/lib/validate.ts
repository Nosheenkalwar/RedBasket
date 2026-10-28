// Each rule returns an error message, or '' when the value is fine.
// The same messages are used by the backend, so the user sees one voice everywhere.

export const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);
export const onlyName = (v: string) => v.replace(/[^A-Za-z\u0600-\u06FF .'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 30);

/** turns "0300-1234567", "+92 300..." or pasted junk into at most 10 digits */
export const phoneDigits = (v: string) => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('92') && d.length > 10) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
};
export const formatPhone = (d: string) => (d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d);

export const rules = {
  phone: (d: string) =>
    !d ? 'Enter your mobile number.' : d[0] !== '3' ? 'Mobile numbers in Pakistan start with 3, like 300 1234567.'
      : d.length < 10 ? `${10 - d.length} more digit${10 - d.length > 1 ? 's' : ''} needed.` : '',
  name: (label: string) => (v: string) =>
    !v.trim() ? `Enter the ${label}.` : v.trim().length < 2 ? `${cap(label)} is too short.` : '',
  email: (optional = true) => (v: string) =>
    !v.trim() ? (optional ? '' : 'Enter the email.') : /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'This email does not look right.',
  password: (v: string) => (/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? '' : 'Use at least 8 characters with letters and numbers.'),
  required: (label: string) => (v: string) => (String(v ?? '').trim() ? '' : `Enter the ${label}.`),
  length: (label: string, min: number, max: number) => (v: string) => {
    const n = v.trim().length;
    return !n ? `Enter the ${label}.` : n < min ? `${cap(label)} needs at least ${min} characters.` : n > max ? `${cap(label)} can be up to ${max} characters.` : '';
  },
  number: (label: string, min: number, max: number) => (v: string) => {
    if (v === '') return `Enter the ${label}.`;
    const n = Number(v);
    return Number.isNaN(n) ? `${cap(label)} must be a number.` : n < min ? `${cap(label)} must be at least ${min}.` : n > max ? `${cap(label)} can be at most ${max}.` : '';
  },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
