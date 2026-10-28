import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { useShop } from '../context/Shop';
import { ProductGrid } from '../components/ProductBits';
import { Empty } from '../components/ui';

export default function Wishlist() {
  const { customer, openAuth } = useAuth();
  const { wishlist, qtyOf, setQty } = useShop();

  if (!customer) return (
    <div className="mx-auto max-w-xl px-5 pt-10">
      <Empty icon={<Heart size={30} />} title="Sign in to see your wishlist" text="Save products you like and come back to them later." action={<button className="btn" onClick={() => openAuth('login')}>Sign in</button>} />
    </div>
  );

  const movable = wishlist.filter((p) => p.stock > 0 && qtyOf(p.id) === 0);
  const moveAll = () => movable.forEach((p) => setQty(p, 1));

  return (
    <div className="mx-auto max-w-7xl px-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pt-7">
        <div><h1 className="display text-4xl">Your wishlist</h1><span className="text-ink-2">{wishlist.length} saved item{wishlist.length === 1 ? '' : 's'}</span></div>
        {movable.length > 0 && <button className="btn" onClick={moveAll}><ShoppingCart size={16} /> Add {movable.length} available to cart</button>}
      </div>
      {wishlist.length ? <ProductGrid items={wishlist} /> : (
        <Empty icon={<Heart size={30} />} title="Nothing saved yet" text="Tap the heart on any product to keep it here for later." action={<Link to="/" className="btn">Browse products</Link>} />
      )}
    </div>
  );
}
