import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useForm } from '../lib/useForm';
import { onlyName, rules } from '../lib/validate';
import type { Customer } from '../lib/types';
import { useAuth } from '../context/Auth';
import { useToast } from '../context/Toast';
import { Field, PhoneField } from './fields';
import { Modal } from './ui';
import Captcha from './Captcha';
import OtpInput from './OtpInput';

type OtpReply = { resendIn: number };

/** Sign in = phone + OTP. Register = names, phone, optional email, reCAPTCHA, terms, then OTP. */
export default function AuthModal() {
  const { authMode, openAuth, signIn } = useAuth();
  const toast = useToast();
  const signup = authMode === 'signup';
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm(
    { firstName: '', lastName: '', phone: '', email: '', terms: false },
    signup
      ? { firstName: rules.name('first name'), lastName: rules.name('last name'), phone: rules.phone, email: rules.email(true), terms: (v) => (v ? '' : 'Please accept the Terms and Privacy Policy.') }
      : { phone: rules.phone },
  );
  const v = form.values;

  useEffect(() => {
    setStep('details');
    setOtp('');
    setServerError('');
    setCaptcha(null);
  }, [authMode]);

  // resend countdown
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // auto-submit once all six digits are in
  useEffect(() => {
    if (step === 'otp' && otp.length === 6) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!authMode) return null;
  const close = () => openAuth(null);

  const sendOtp = async () => {
    setServerError('');
    if (!form.validate()) return;
    if (!captcha) return setServerError('Please tick "I\'m not a robot".');
    setBusy(true);
    try {
      const r = await api<OtpReply>('/auth/otp', { method: 'POST', body: { phone: v.phone, purpose: authMode, recaptchaToken: captcha } });
      setCaptcha(null); // a reCAPTCHA token works only once
      setWait(r.resendIn);
      setOtp('');
      setStep('otp');
      toast('Code sent to +92 ' + v.phone);
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (otp.length < 6) return setServerError('Enter all 6 digits.');
    setBusy(true);
    setServerError('');
    try {
      const body = signup
        ? { phone: v.phone, otp, firstName: v.firstName, lastName: v.lastName, email: v.email || undefined, acceptTerms: v.terms }
        : { phone: v.phone, otp };
      const r = await api<{ token: string; customer: Customer }>(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body });
      signIn(r.token, r.customer);
      toast(signup ? `Account created. Welcome, ${r.customer.firstName}!` : `Signed in as ${r.customer.firstName}`);
      close();
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={step === 'otp' ? 'Enter the code' : signup ? 'Create your account' : 'Sign in'} onClose={close}>
      {step === 'details' ? (
        <form className="mt-1 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); sendOtp(); }} noValidate>
          <p className="mb-2 text-ink-2">{signup ? 'Takes a minute. No password needed, you sign in with your phone.' : 'Enter your mobile number and we will text you a 6-digit code.'}</p>
          {signup && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" placeholder="Sana" autoComplete="given-name" autoFocus value={v.firstName}
                onChange={(e) => form.set('firstName', onlyName(e.target.value))} error={form.error('firstName')} good={!!v.firstName && form.isValid('firstName')} />
              <Field label="Last name" placeholder="Ahmed" autoComplete="family-name" value={v.lastName}
                onChange={(e) => form.set('lastName', onlyName(e.target.value))} error={form.error('lastName')} good={!!v.lastName && form.isValid('lastName')} />
            </div>
          )}
          <PhoneField value={v.phone} onChange={(d) => form.set('phone', d)} error={form.error('phone')} autoFocus={!signup} />
          {signup && (
            <Field label="Email (optional, for receipts)" type="email" placeholder="you@example.com" autoComplete="email" value={v.email}
              onChange={(e) => form.set('email', e.target.value.trim())} error={form.error('email')} good={!!v.email && form.isValid('email')} />
          )}
          <Captcha key={authMode} onChange={setCaptcha} />
          {signup && (
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-ink-2">
              <input type="checkbox" className="mt-0.5" checked={v.terms} onChange={(e) => form.set('terms', e.target.checked)} />
              <span>I agree to the <a className="link" href="/terms" target="_blank" rel="noreferrer">Terms of Use</a> and <a className="link" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                {form.error('terms') && <b className="block text-cherry">{form.error('terms')}</b>}</span>
            </label>
          )}
          {serverError && <p className="text-sm font-semibold text-cherry">{serverError}</p>}
          <button className="btn mt-1 w-full py-3" disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button>
          {!signup && <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3"><ShieldCheck size={13} /> Protected by reCAPTCHA</p>}
          <p className="text-center text-sm text-ink-2">
            {signup ? 'Already have an account? ' : 'New to RedBasket? '}
            <button type="button" className="link" onClick={() => openAuth(signup ? 'login' : 'signup')}>{signup ? 'Sign in' : 'Create an account'}</button>
          </p>
        </form>
      ) : (
        <div>
          <p className="text-ink-2">Sent to <b className="text-noir">+92 {v.phone}</b>. The code expires in 5 minutes.</p>
          <OtpInput value={otp} onChange={(c) => { setOtp(c); setServerError(''); }} />
          {serverError && <p className="mb-2 text-sm font-semibold text-cherry">{serverError}</p>}
          <button className="btn w-full py-3" onClick={verify} disabled={busy}>{busy ? 'Checking…' : signup ? 'Verify and create account' : 'Verify and sign in'}</button>
          {wait <= 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <Captcha onChange={setCaptcha} />
              <button className="btn-ghost w-full" onClick={sendOtp} disabled={!captcha || busy}>Resend code</button>
            </div>
          )}
          <p className="mt-3 text-center text-[13px] text-ink-2">
            {wait > 0 && `Resend code in ${wait}s | `}
            <button className="link" onClick={() => setStep('details')}>Change number</button>
          </p>
        </div>
      )}
    </Modal>
  );
}
