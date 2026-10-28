import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

type Section = { id: string; title: string; body: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const UPDATED = '20 October 2026';

const DOCS: Record<string, Doc> = {
  terms: {
    title: 'Terms of Use',
    intro: 'These terms apply when you browse RedBasket or buy from us. By creating an account or placing an order you agree to them. Please read them once; they are short.',
    sections: [
      { id: 'about', title: '1. Who we are', body: [
        'RedBasket is an online supermarket based in Karachi, Pakistan. We sell groceries, household items, electronics, clothing, toys and beauty products from one warehouse and deliver them ourselves.',
        'When these terms say "we" or "us" they mean RedBasket. "You" means the person using the website.'] },
      { id: 'account', title: '2. Your account', body: [
        'You sign up and log in with your Pakistani mobile number and a one-time code (OTP) that we send by SMS. One mobile number can have only one account.',
        'Keep your phone with you and never share the code. Anyone who has the code can open your account. If you think someone else has used your account, contact us straight away.',
        'You must be at least 18 years old, or use the website with a parent or guardian.',
        'We may block an account that gives false details, misuses offers or harms other customers or our staff.'] },
      { id: 'orders', title: '3. Prices and orders', body: [
        'All prices are in Pakistani Rupees and include tax. The price you see when you place the order is the price you pay, even if it changes later.',
        'Product photos are for guidance. Fresh items such as fruit and vegetables can vary slightly in size and colour.',
        'An order is confirmed when our team accepts it. If an item runs out after you order, we will call you and either replace it with your permission or remove it from the bill.',
        'You can cancel an order while it is Placed or Confirmed. Once it is packed it cannot be cancelled, but you can still return it as explained below.'] },
      { id: 'payment', title: '4. Payment', body: [
        'You can pay cash on delivery or by card. Please keep the exact amount ready for cash orders; our riders may not carry change for large notes.',
        'We never store your full card number or CVV. Card payments in this version of RedBasket are test payments and no real money is charged.'] },
      { id: 'delivery', title: '5. Delivery', body: [
        'We deliver only inside Karachi. Delivery fees, free delivery limits and time slots are explained on our Shipping and Delivery page.',
        'Please check your order when it arrives. If something is missing or damaged, tell the rider or contact us within 24 hours.'] },
      { id: 'returns', title: '6. Returns and exchanges', body: [
        'You can return or exchange most items within 7 days of delivery if they are unused and in their original packing.',
        'Fresh food, frozen food, opened personal care items and underwear cannot be returned unless they arrived damaged, spoiled or wrong.',
        'We collect returns from your door. Once we receive and check the item, the refund goes back the way you paid, or to your RedBasket wallet when it is available.'] },
      { id: 'use', title: '7. Using the website fairly', body: [
        'Do not try to break, overload or copy the website, use bots to create accounts, or place orders you do not intend to accept.',
        'The RedBasket name, logo and content on this website belong to us and may not be used without our written permission.'] },
      { id: 'liability', title: '8. Our responsibility', body: [
        'We do our best to keep the website correct and working, but we cannot promise it will always be free of errors or available.',
        'Our responsibility for any order is limited to the amount you paid for it. This does not affect your rights under the consumer protection laws of Sindh, Pakistan.'] },
      { id: 'changes', title: '9. Changes and contact', body: [
        'We may update these terms. The date at the top shows the latest version. Big changes will also be shown when you log in.',
        'Questions? Call 021 111 732 227 or email help@redbasket.pk.'] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This page explains what information RedBasket collects, why we need it and how we keep it safe. We collect only what we need to run the store and deliver your orders.',
    sections: [
      { id: 'collect', title: '1. What we collect', body: [
        'Account details: your first and last name, mobile number and, if you give it, your email address.',
        'Delivery details: the addresses you save, including house number, street, landmark and area.',
        'Shopping details: your cart, wishlist, orders, payment method and order history.',
        'Technical details: the type of browser and device, and basic logs that help us find errors and stop misuse.'] },
      { id: 'use', title: '2. How we use it', body: [
        'To create your account and log you in with a one-time code.',
        'To pack, deliver and support your orders, and to send you order updates.',
        'To keep the right stock. Sales figures, without your name, help us predict what to reorder so popular items do not run out.',
        'To protect the website from bots and fraud. Our sign up, login and staff pages use Google reCAPTCHA, which is covered by Google\'s own privacy policy and terms.'] },
      { id: 'share', title: '3. Who we share it with', body: [
        'Our riders see your name, phone number and delivery address only for the orders they deliver.',
        'Our SMS provider receives your mobile number to send the one-time code.',
        'We do not sell or rent your personal information to anyone, and we do not share it for advertising.',
        'We may share information if the law requires it, for example on a valid request from the authorities in Pakistan.'] },
      { id: 'security', title: '4. How we keep it safe', body: [
        'All traffic to RedBasket is encrypted. Staff passwords are stored only in a scrambled (hashed) form and one-time codes expire after 5 minutes.',
        'Only staff who need your information for their job can see it, and every important staff action is recorded in an activity log.',
        'We never store your full card number or CVV.'] },
      { id: 'keep', title: '5. How long we keep it', body: [
        'We keep your account while it is active. Order records are kept for at least 2 years for accounting and stock planning.',
        'Expired one-time codes are deleted automatically within 24 hours.'] },
      { id: 'rights', title: '6. Your choices', body: [
        'You can see and change your name, email and addresses from My account at any time.',
        'To close your account or ask for a copy of your data, email help@redbasket.pk from the email on your account or call us from your registered number.'] },
      { id: 'contact', title: '7. Contact', body: ['RedBasket, Plot 14, Sector 23, Korangi Industrial Area, Karachi. Phone 021 111 732 227. Email help@redbasket.pk.'] },
    ],
  },
  shipping: {
    title: 'Shipping and Delivery',
    intro: 'We deliver from our own warehouse to homes and offices across Karachi. Your delivery fee is worked out automatically at checkout using the rules below.',
    sections: [
      { id: 'where', title: '1. Where we deliver', body: [
        'Only inside Karachi. At checkout you choose your area from our list; addresses outside the list cannot be used yet.'] },
      { id: 'fees', title: '2. Delivery fees', body: [
        'Central Karachi (Clifton, DHA, Saddar, PECHS, Bahadurabad, Tariq Road and nearby): Rs. 149.',
        'Mid Karachi (Gulshan-e-Iqbal, Gulistan-e-Jauhar, North Nazimabad, FB Area, Gulberg and nearby): Rs. 199.',
        'Outer Karachi (Malir, Korangi, Landhi, Orangi, North Karachi, Surjani, Bahria Town and nearby): Rs. 249.',
        'Orders of Rs. 3,000 or more are delivered free.',
        'Orders heavier than 20 kg have an extra Rs. 150 handling charge, even when delivery is free.'] },
      { id: 'slots', title: '3. Delivery times', body: [
        'Order before 4 PM and choose a same-day slot (6 to 8 PM or 8 to 10 PM). After 4 PM the earliest slots are the next day.',
        'Orders up to 15 kg come by bike rider. Heavier orders come in the RedBasket van.'] },
      { id: 'track', title: '4. Tracking your order', body: [
        'You can follow every step from My account, My orders: Placed, Confirmed, Packed, Out for delivery and Delivered.'] },
    ],
  },
};

export default function Legal() {
  const { pathname, hash } = useLocation();
  const key = pathname.slice(1) as keyof typeof DOCS;
  const doc = DOCS[key] || DOCS.terms;

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  const tab = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-noir text-cotton' : 'text-ink-2 hover:bg-tint hover:text-noir'}`;

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 pt-8 lg:grid-cols-[230px_1fr]">
      <aside className="panel flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-44 lg:flex-col">
        <NavLink to="/terms" className={tab}>Terms of Use</NavLink>
        <NavLink to="/privacy" className={tab}>Privacy Policy</NavLink>
        <NavLink to="/shipping" className={tab}>Shipping and Delivery</NavLink>
      </aside>
      <article className="max-w-3xl">
        <h1 className="display text-[clamp(32px,4.4vw,46px)] leading-tight">{doc.title}</h1>
        <p className="mt-1 text-sm text-ink-3">Last updated {UPDATED}</p>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-2">{doc.intro}</p>
        <nav className="my-7 flex flex-wrap gap-2" aria-label="On this page">
          {doc.sections.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border-[1.5px] border-line bg-card px-3 py-1 text-[13px] font-semibold hover:border-noir">{s.title.replace(/^\d+\.\s*/, '')}</a>)}
        </nav>
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-44 border-t border-dashed border-line py-6">
            <h2 className="display mb-3 text-2xl">{s.title}</h2>
            <ul className="space-y-2.5 text-[15px] leading-relaxed text-ink-2">
              {s.body.map((b) => <li key={b} className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-cherry">{b}</li>)}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
}
