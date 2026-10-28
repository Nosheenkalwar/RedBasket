import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { FaCcMastercard, FaCcVisa, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useCategories } from '../lib/useCategories';
import { useAuth } from '../context/Auth';
import { Logo } from './Header';

const HELP = [
  { Icon: Phone, title: '021 111 732 227', text: 'Call us, 9 AM to 11 PM every day' },
  { Icon: FaWhatsapp, title: '0300 733 2275', text: 'WhatsApp for order help' },
  { Icon: Mail, title: 'help@redbasket.pk', text: 'We reply within a few hours' },
];
const SOCIAL: { Icon: IconType; label: string; href: string }[] = [
  { Icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/redbasket.pk' },
  { Icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com/redbasket.pk' },
  { Icon: FaWhatsapp, label: 'WhatsApp', href: 'https://wa.me/923007332275' },
];
const PAYMENTS: { Icon: IconType; label: string; color: string }[] = [
  { Icon: FaMoneyBillWave, label: 'Cash on delivery', color: '#2E6B45' },
  { Icon: FaCcVisa, label: 'Visa', color: '#1A1F71' },
  { Icon: FaCcMastercard, label: 'Mastercard', color: '#EB001B' },
  { Icon: FaCreditCard, label: 'Debit card', color: '#1B1716' },
];

export default function Footer() {
  const cats = useCategories();
  const { customer, openAuth } = useAuth();
  const accountLink = (to: string, text: string) => customer
    ? <Link to={to} className="hover:text-white hover:underline">{text}</Link>
    : <button onClick={() => openAuth('login')} className="text-left hover:text-white hover:underline">{text}</button>;

  return (
    <footer className="mt-16 bg-noir text-cotton/85">
      <div className="border-b border-cotton/10 bg-cherry-dark">
        <div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-3">
          {HELP.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3.5 py-5">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-cotton/10 text-cotton"><Icon size={19} /></span>
              <span><b className="block text-[15px] text-cotton">{title}</b><small className="text-[12.5px] text-cotton/70">{text}</small></span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-9 px-5 pb-10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed">Groceries, household items, electronics and clothing from one store, delivered to your door across Karachi.</p>
          <div className="mt-5 flex gap-2.5">
            {SOCIAL.map(({ Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`RedBasket on ${label}`} title={label}
                className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-cotton/30 transition hover:border-cotton hover:bg-cotton hover:text-noir"><Icon size={17} /></a>
            ))}
          </div>
        </div>

        <FooterCol title="Shop">
          {cats.map((c) => <li key={c.id}><Link to={`/c/${c.id}`} className="hover:text-white hover:underline">{c.name}</Link></li>)}
        </FooterCol>

        <FooterCol title="Your account">
          <li>{accountLink('/account', 'My account')}</li>
          <li>{accountLink('/account/orders', 'My orders')}</li>
          <li>{accountLink('/account/addresses', 'Saved addresses')}</li>
          <li><Link to="/wishlist" className="hover:text-white hover:underline">Wishlist</Link></li>
        </FooterCol>

        <FooterCol title="Help and policies">
          <li><Link to="/shipping" className="hover:text-white hover:underline">Shipping and delivery</Link></li>
          <li><Link to="/terms#returns" className="hover:text-white hover:underline">Returns and exchanges</Link></li>
          <li><Link to="/terms" className="hover:text-white hover:underline">Terms of Use</Link></li>
          <li><Link to="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link></li>
        </FooterCol>

        <FooterCol title="Visit or write to us">
          <li className="flex gap-2.5"><MapPin size={16} className="mt-0.5 flex-none text-[#E8A39C]" />Plot 14, Sector 23, Korangi Industrial Area, Karachi</li>
          <li className="flex gap-2.5"><Clock size={16} className="mt-0.5 flex-none text-[#E8A39C]" />Deliveries 10 AM to 10 PM, all week</li>
          <li className="flex gap-2.5"><Mail size={16} className="mt-0.5 flex-none text-[#E8A39C]" />help@redbasket.pk</li>
        </FooterCol>
      </div>

      <div className="border-t border-cotton/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 text-[12.5px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-cotton/60">We accept</span>
            {PAYMENTS.map(({ Icon, label, color }) => (
              <span key={label} title={label} aria-label={label} className="grid h-8 w-12 place-items-center rounded-md bg-white shadow-sm"><Icon size={label === 'Cash on delivery' || label === 'Debit card' ? 19 : 28} color={color} /></span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-cotton/60">
            <span>© 2026 RedBasket, Karachi</span>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/shipping" className="hover:text-white">Shipping</Link>
            <Link to="/admin" className="hover:text-white">Staff portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FooterCol = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h4 className="mb-4 text-[15px] font-bold text-cotton">{title}</h4>
    <ul className="space-y-2.5 text-sm">{children}</ul>
  </div>
);
