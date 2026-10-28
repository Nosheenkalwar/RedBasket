import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, House, LogOut, MapPin, ShoppingCart, User, LucideIcon } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { useShop } from '../context/Shop';
import { useCategories } from '../lib/useCategories';
import SearchBox from './SearchBox';
import { iconForCategory } from '../lib/categoryLook';

// on dark backgrounds the logo sits on a cream card, because "Red" in the logo is black
export const Logo = ({ dark }: { dark?: boolean }) => (
  <span className={`inline-flex items-center ${dark ? 'rounded-xl bg-cotton px-3 py-1.5' : ''}`}>
    <img src="/RedBasket Basket Logo.png" alt="RedBasket" className={dark ? 'h-10 w-auto' : 'h-16 w-auto'} />
  </span>
);

export default function Header() {
  const { cart, wishlist, setDrawerOpen } = useShop();
  const cats = useCategories();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cotton">
      <Ticker />
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-3.5 max-lg:grid-cols-[auto_auto] max-lg:justify-between">
          <Link to="/" aria-label="RedBasket home"><Logo /></Link>
          <div className="max-lg:order-3 max-lg:col-span-2"><SearchBox /></div>
          <div className="flex items-center gap-2.5">
           <span className="hidden items-center gap-2 whitespace-nowrap rounded-[10px] border-[1.5px] border-line bg-card px-4 py-1.5 text-[11px] xl:flex">
  <MapPin size={17} />
  <span className="flex items-center gap-1.5">
    <small className="text-[12px] text-ink-2">Deliver to</small>
    <b className="text-[13px]">Karachi</b>
  </span>
</span>
            <AccountMenu />
            <Link to="/wishlist" className="iconbtn" aria-label={`Wishlist (${wishlist.length})`}>
              <Heart size={20} fill={wishlist.length ? 'currentColor' : 'none'} />
              {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
            </Link>
            <button className="iconbtn" onClick={() => setDrawerOpen(true)} aria-label="Open cart">
              <ShoppingCart size={20} />{cart.count > 0 && <span className="badge">{cart.count}</span>}
            </button>
          </div>
        </div>

        <nav className="flex gap-1.5 overflow-x-auto pb-3 pt-1 lg:justify-center" aria-label="Categories">
          <CatButton to="/" label="Home" Icon={House} on={pathname === '/'} />
          {cats.map((c) => <CatButton key={c.id} to={`/c/${c.id}`} label={c.name} Icon={iconForCategory(c.name)} on={pathname === `/c/${c.id}`} />)}
        </nav>
      </div>
    </header>
  );
}

function CatButton({ to, label, Icon, on }: { to: string; label: string; Icon: LucideIcon; on: boolean }) {
  return (
    <NavLink to={to} className="group flex w-[84px] flex-none flex-col items-center gap-1.5" aria-current={on ? 'page' : undefined}>
      <span className={`grid h-[50px] w-[50px] place-items-center rounded-full border-[1.5px] transition group-hover:-translate-y-0.5 ${on ? 'border-cherry bg-cherry text-cotton' : 'border-line bg-card text-cherry group-hover:border-cherry group-hover:bg-cherry-soft'}`}>
        <Icon size={23} strokeWidth={1.9} />
      </span>
      <span className={`text-center text-[12.5px] font-semibold leading-tight ${on ? 'font-bold text-cherry' : 'text-ink-2 group-hover:text-noir'}`}>{label}</span>
    </NavLink>
  );
}

/** guest: Sign in button + Register link. Logged in: round avatar with name and a small menu. */
function AccountMenu() {
  const { customer, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const initials = customer ? (customer.firstName[0] + customer.lastName[0]).toUpperCase() : '';
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-tint';

  return (
    <div className="group relative" onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-tint" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        {customer
          ? <span className="grid h-9 w-9 place-items-center rounded-full bg-cherry text-[13px] font-bold text-cotton ring-2 ring-cotton ring-offset-0 outline outline-[1.5px] outline-cherry">{initials}</span>
          : <span className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-noir"><User size={18} /></span>}
        <span className="hidden text-left leading-tight md:block">
          <small className="block text-[11.5px] text-ink-2">{customer ? 'Salaam,' : 'Hello, sign in'}</small>
          <b className="flex items-center gap-0.5 text-sm">{customer ? customer.firstName : 'Account'}<ChevronDown size={14} /></b>
        </span>
      </button>
      <div className={`absolute right-0 top-full z-40 w-60 pt-2.5 ${open ? 'block' : 'hidden'} group-hover:block`} role="menu">
        <div className="rounded-b-xl rounded-t border-[1.5px] border-t-[3px] border-line border-t-cherry bg-card p-4 shadow-xl">
          {customer ? (
            <>
              <div className="mb-1.5 border-b border-dashed border-line pb-3">
                <b className="block">{customer.firstName} {customer.lastName}</b>
                <small className="text-ink-2">{customer.phoneNumber.replace('+92', '+92 ')}</small>
              </div>
              <button className={item} onClick={() => { setOpen(false); nav('/account'); }}><User size={17} /> My account</button>
              <button className={item} onClick={() => { setOpen(false); nav('/account/addresses'); }}><MapPin size={17} /> Addresses</button>
              <button className={item} onClick={() => { setOpen(false); nav('/wishlist'); }}><Heart size={17} /> Wishlist</button>
              <button className={`${item} mt-1 border-t border-dashed border-line pt-2.5 text-cherry`} onClick={() => { setOpen(false); signOut(); nav('/'); }}><LogOut size={17} /> Sign out</button>
            </>
          ) : (
            <div className="text-center">
              <button className="btn w-full py-3" onClick={() => { setOpen(false); openAuth('login'); }}>Sign in</button>
              <p className="mt-3 text-[13.5px] text-ink-2">New to RedBasket? <button className="link" onClick={() => { setOpen(false); openAuth('signup'); }}>Register</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NEWS = [
  'Free delivery on orders above Rs. 3,000',
  'Same-day delivery across Karachi when you order before 4 PM',
  'Cash on delivery and card payments accepted',
  'Fresh bread, milk and eggs restocked every morning',
  '7-day easy returns, we pick it up from your door',
];

/** announcement bar: the messages scroll in a loop and pause when you hover */
function Ticker() {
  // the list is drawn twice and slid by half its width, so the loop has no visible jump
  const items = [...NEWS, ...NEWS];
  return (
    <div className="group overflow-hidden bg-cherry text-[13px] font-medium text-cotton" role="region" aria-label="Announcements">
      <ul className="flex w-max animate-[ticker_40s_linear_infinite] py-2 group-hover:[animation-play-state:paused]">
        {items.map((n, i) => (
          <li key={i} aria-hidden={i >= NEWS.length} className="flex flex-none items-center gap-10 whitespace-nowrap pl-10">
            {n}<span className="h-1 w-1 flex-none rounded-full bg-cotton/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}
