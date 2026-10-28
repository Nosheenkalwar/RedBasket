import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

/** Google reCAPTCHA v2 checkbox. The token is checked again on the server before an OTP is sent. */
export default function Captcha({ onChange }: { onChange: (token: string | null) => void }) {
  return (
    <div className="min-h-[78px]">
      <ReCAPTCHA sitekey={SITE_KEY} onChange={onChange} onExpired={() => onChange(null)} onErrored={() => onChange(null)} />
    </div>
  );
}
