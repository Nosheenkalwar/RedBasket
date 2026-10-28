import { CSSProperties, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryNode } from '../lib/types';

type Box = { left: number; top: number; width: number; height: number };
type Slide = { image: string; alt: string; category: string; ratio: number; button: Box; dots: Box };

// The banner artwork already has its headline and button painted in.
// `button` and `dots` are where those sit on the picture (in %), so the real link and slide dots line up with them.
const SLIDES: Slide[] = [
  { image: '/banners/grocery.webp', alt: 'Your weekly groceries, at your door by tonight. Shop groceries', category: 'Groceries', ratio: 2.1027,
    button: { left: 4.93, top: 72.68, width: 18.82, height: 11.67 }, dots: { left: 4.6, top: 90.4, width: 9, height: 4.4 } },
  { image: '/banners/bakery.webp', alt: 'Warm bread, cold milk, a better breakfast. Shop the bakery', category: 'Groceries', ratio: 2.0703,
    button: { left: 4.79, top: 74.11, width: 20.41, height: 11.07 }, dots: { left: 4.46, top: 91.6, width: 8.1, height: 4.6 } },
  { image: '/banners/electronics.webp', alt: 'The tech you reach for every day. Shop electronics', category: 'Electronics', ratio: 2.0481,
    button: { left: 4.22, top: 74.56, width: 20.19, height: 11.2 }, dots: { left: 3.93, top: 91.2, width: 10.3, height: 4.7 } },
    { image: '/banners/Beauty-1.png', alt: 'Style,Beauty,Delivered', category: 'Beauty', ratio: 2.0481,
    button: { left: 4.22, top: 74.56, width: 20.19, height: 11.2 }, dots: { left: 3.93, top: 91.2, width: 10.3, height: 4.7 } },
];

const pos = (b: Box): CSSProperties => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` });

export default function HomeBanner({ cats }: { cats: CategoryNode[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const linkFor = (name: string) => `/c/${cats.find((c) => c.name === name)?.id ?? cats[0]?.id ?? ''}`;
  const slide = SLIDES[i];

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((i + 1) % SLIDES.length), 6000);
    return () => clearTimeout(t);
  }, [i, paused]);

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[2.1fr_1fr]" aria-label="Featured offers">
      <div className="relative overflow-hidden rounded-[22px] bg-[#EAE6D8]" style={{ aspectRatio: SLIDES[0].ratio }}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {SLIDES.map((s, k) => (
          <div key={s.image} aria-hidden={k !== i}
            className={`absolute inset-0 transition-all duration-700 ease-out ${k === i ? 'opacity-100' : 'pointer-events-none translate-x-6 opacity-0'}`}>
            <img src={s.image} alt={s.alt} draggable={false}
              className={`h-full w-full select-none object-cover transition-transform duration-[6000ms] ease-linear ${k === i && !paused ? 'scale-[1.035]' : 'scale-100'}`} />
            {/* the painted button becomes a real link with the same hover feel as our buttons */}
            <Link to={linkFor(s.category)} tabIndex={k === i ? 0 : -1} aria-label={s.alt.split('. ').pop()} style={pos(s.button)}
              className="absolute rounded-[1vw] transition hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-[0_10px_24px_-10px_rgba(129,1,0,.7)] focus-visible:outline-cotton" />
            {/* the rest of the banner also opens the category */}
            <Link to={linkFor(s.category)} tabIndex={-1} aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2" />
          </div>
        ))}
        <div className="absolute z-[2] flex items-center gap-[0.45vw]" style={pos(slide.dots)}>
          {SLIDES.map((s, k) => (
            <button key={s.image} onClick={() => setI(k)} aria-label={`Show slide ${k + 1}`} aria-current={k === i}
              className={`h-2.5 rounded-full transition-all duration-300 ${k === i ? 'w-8 bg-cherry' : 'w-2.5 bg-ink-3/60 hover:bg-ink-2'}`} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Link to={linkFor('Household')} className="group relative flex min-h-[202px] items-end overflow-hidden rounded-[22px] border-[1.5px] border-line bg-card p-6">
          <img src="/banners/cleaning.webp" alt="" className="absolute -right-2 top-1/2 w-[52%] max-w-[230px] -translate-y-1/2 drop-shadow-xl transition-transform duration-500 group-hover:-translate-y-[54%] group-hover:rotate-[-2deg]" />
          <span className="relative z-[1] max-w-[52%]">
            <b className="display block text-[22px] leading-tight">Home care that lasts the month</b>
            <small className="mt-1 block text-ink-2">Detergent, cleaners and storage</small>
            <span className="mt-3 inline-block border-b-2 border-cherry pb-0.5 text-sm font-bold text-cherry">Shop now</span>
          </span>
        </Link>
        <Link to={linkFor('Clothing')} aria-label="New season basics for the family. Shop clothing"
          className="group relative block overflow-hidden rounded-[22px] bg-[#F2DCD9]" style={{ aspectRatio: 1.943 }}>
          <img src="/banners/family.webp" alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          <span className="btn btn-sm absolute left-[6.2%] top-[73%] group-hover:-translate-y-0.5 group-hover:bg-cherry-dark">Shop now</span>
        </Link>
      </div>
    </section>
  );
}
