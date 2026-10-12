// ─── Public landing · Sarvotam Construction, Dahegam ───
// Cinematic dark identity inspired by dg-cinema.com — rebuilt for construction.
import { AnimatePresence, motion, useInView, useScroll, useSpring } from 'framer-motion';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarClock, Construction,
  Globe, HardHat, Mail, MapPin, Menu, MessageCircle, Phone, Ruler, Send, ShieldCheck,
  Sparkles, Truck, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// ───────────────────────── helpers ─────────────────────────
const IMG = (n: string) => `/img/${n}.jpg`;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function Reveal({ children, delay = 0, y = 34, className = '' }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StaggerWords({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: '0.6em', rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: delay + i * 0.085, type: 'spring', stiffness: 190, damping: 22 }}
        >
          {w}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.32em] text-gold uppercase">
      <span className="h-px w-8 bg-gold/70" />
      {children}
    </div>
  );
}

// ───────────────────────── data ─────────────────────────
const heroStrip = ['hero-sunset', 'night-cranes', 'tower-rise', 'masons-bricks', 'crane-cab', 'interchange-aerial'];

const projects = [
  {
    id: 'hub', tag: 'Commercial', title: 'Sarvotam Business Hub', place: 'Dahegam, Gujarat',
    year: '2025 — on site', cover: 'frame-concrete',
    gallery: ['frame-concrete', 'warehouse-steel', 'shed-interior', 'tower-rise', 'foundation-rebar', 'crane-sky'],
    brief: 'A G+3 RCC-framed commercial complex with 14 road-facing showrooms, basement parking and a terracotta-clad entrance court — the first landmark we designed, built and finished end-to-end.',
    scope: 'Excavation and raft foundation, RCC frame with 420 MT of steel, brick masonry, terracotta + stone cladding, terrazzo flooring, full electrical & plumbing services, and external development. Handed over in 22 months with zero lost-time incidents.',
    specs: [['Area', '48,600 sq.ft'], ['Structure', 'RCC raft + frame'], ['Steel', '420 MT'], ['Duration', '22 months']],
  },
  {
    id: 'villas', tag: 'Residential', title: 'Greenfield Villa Row', place: 'Gandhinagar outskirts',
    year: '2024', cover: 'house-modern',
    gallery: ['house-modern', 'villa-vertical', 'house-concrete', 'house-tree', 'masonry-hands', 'plaster-work'],
    brief: 'Six duplex villas in exposed concrete and lime plaster — deep verandahs, courtyard light wells and roof gardens, built for three families who wanted homes that age like stone, not paint.',
    scope: 'Turnkey delivery from soil test to keys: foundation, RCC frame, fly-ash masonry, lime plaster, kota & wood flooring, joinery, landscape and boundary. Each villa handed over with a 10-year structure warranty.',
    specs: [['Area', '6 × 3,150 sq.ft'], ['Structure', 'RCC + exposed concrete'], ['Finish', 'Lime plaster · kota'], ['Duration', '16 months']],
  },
  {
    id: 'flyover', tag: 'Infrastructure', title: 'SH-41 Flyover Approach', place: 'State Highway 41',
    year: '2023', cover: 'bridge-aerial',
    gallery: ['bridge-aerial', 'interchange-aerial', 'highway-curve', 'road-paver', 'retaining-wall', 'excavator-top'],
    brief: '1.4 km of elevated approach: 28 precast girders launched over a live highway, with reinforced-earth retaining walls and a full bituminous carriageway — night-shifted to keep the road alive.',
    scope: 'Earthwork of 62,000 cum, bored piles, pier caps, girder launching at night under traffic blocks, RE walls, DBM + BC layers and road furniture. Completed 6 weeks ahead of the monsoon deadline.',
    specs: [['Length', '1.4 km'], ['Girders', '28 precast'], ['Earthwork', '62,000 cum'], ['Duration', '19 months']],
  },
  {
    id: 'shed', tag: 'Industrial', title: 'Precast Industrial Shed', place: 'Dahegam GIDC',
    year: '2022', cover: 'shed-curved',
    gallery: ['shed-curved', 'warehouse-interior', 'shed-interior', 'excavator-site', 'foundation-rebar', 'cranes-duo'],
    brief: 'A 96 m clear-span precast + PEB shed for a logistics operator: crane-ready columns, 12 m eave height and a curved roof profile that sheds monsoon water in seconds.',
    scope: 'Isolated footings, precast columns & girders, PEB rafters, insulated roof sheeting, VDF flooring rated for 5 T/sq.m, dock levellers and 240 kVA electrical infrastructure. Built-to-suit, leased on completion.',
    specs: [['Span', '96 m clear'], ['Eave', '12 m'], ['Floor', 'VDF · 5 T/sq.m'], ['Duration', '11 months']],
  },
];

const team = [
  { name: 'Anshuman Ubhadiya', role: 'Founder & Managing Director', img: 'engineer-portrait', note: '16 years · 120+ sites' },
  { name: 'Rakesh Patel', role: 'Chief Site Engineer', img: 'engineer-site', note: 'RCC & structures' },
  { name: 'Imran Shaikh', role: 'Projects & Estimation', img: 'engineer-drawings', note: 'Rates · BOQ · tenders' },
  { name: 'Mahesh Solanki', role: 'Site Supervisor · Infra', img: 'worker-portrait', note: 'Earthwork & roads' },
  { name: 'Harish Prajapati', role: 'Safety Officer', img: 'worker-smile', note: 'Zero-LTI record' },
  { name: 'The Site Crew', role: '120+ workers on roll', img: 'crew-three', note: 'Masons · bar-benders · operators' },
];

const services = [
  {
    icon: <Building2 size={22} />, title: 'Civil Construction', img: 'masons-bricks',
    desc: 'RCC framed homes, duplexes and commercial blocks — from raft to roof, masonry to mirror finish.',
    points: ['RCC frames & foundations', 'Brick / AAC masonry & plaster', 'Flooring, cladding & paint', 'Waterproofing & repairs'],
  },
  {
    icon: <Truck size={22} />, title: 'Infrastructure & Roads', img: 'road-paver',
    desc: 'Earthwork, retaining structures, bridges and carriageways built to highway-grade tolerances.',
    points: ['Earthwork & compaction', 'RE walls & box drains', 'CC roads & bituminous layers', 'Bridge & culvert works'],
  },
  {
    icon: <Construction size={22} />, title: 'Industrial & Turnkey', img: 'shed-curved',
    desc: 'PEB and precast sheds, warehouses and factories — designed, built and handed over ready to run.',
    points: ['PEB / precast structures', 'VDF & heavy-duty floors', 'Fire, electrical & utilities', 'Design-build handover'],
  },
];

const marqueeWords = [
  { t: 'redefines', img: 'crane-cab' }, { t: 'civil construction' }, { t: 'with', img: 'masonry-hands' },
  { t: 'precision &' }, { t: 'pride', img: 'steel-sunburst' },
];

// ───────────────────────── preloader ─────────────────────────
function Preloader({ done }: { done: boolean }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(100, p + Math.ceil((100 - p) / 9) + 1)), 55);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="grain fixed inset-0 z-[90] flex flex-col justify-between bg-night px-6 py-8 sm:px-10"
        >
          <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.3em] text-ink/50 uppercase">
            <span>Sarvotam Construction</span>
            <span>Dahegam · Gujarat</span>
          </div>
          <div className="relative">
            <div className="headline-xl text-[16vw] text-ink sm:text-[9vw]">
              We build what
              <br />
              <span className="outline-type-gold">outlives us</span>
            </div>
            <div className="mt-6 h-px w-full bg-ink/15">
              <motion.div className="h-px bg-gold" animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut', duration: 0.2 }} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3 text-ink/60">
              <Construction size={20} className="text-gold" />
              <span className="font-mono text-[11px] tracking-[0.28em] uppercase">Loading site…</span>
            </div>
            <div className="font-mono text-5xl font-medium text-gold tabular-nums">{pct}%</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────── header ─────────────────────────
const navLinks = [
  { href: '#work', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#team', label: 'Team' },
  { href: '#careers', label: 'Careers' },
  { href: '#contact', label: 'Contact' },
];

function Header({ onMenu }: { onMenu: () => void }) {
  const clock = useClock();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useEffect(() => scrollY.on('change', (v) => setSolid(v > 40)), [scrollY]);
  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? 'border-b border-line/70 bg-night/80 backdrop-blur-xl' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3.5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold">
            <svg viewBox="0 0 32 32" className="h-5 w-5"><path d="M7 22 L16 8 L25 22 Z" fill="#0d0e12" /><rect x="10.5" y="22" width="11" height="3" rx="1" fill="#0d0e12" /></svg>
          </span>
          <span className="leading-none">
            <span className="font-display block text-[16px] font-bold tracking-tight text-ink">SARVOTAM</span>
            <span className="font-mono block text-[9px] tracking-[0.34em] text-gold uppercase">Construction</span>
          </span>
        </a>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="group relative px-3.5 py-2 text-[13px] font-semibold text-ink/65 transition hover:text-ink">
              {l.label}
              <span className="absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <div className="hidden items-center gap-2 font-mono text-[11px] text-ink/50 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            {clock} IST
          </div>
          <Link
            to="/login"
            className="hidden rounded-full border border-line px-4 py-2 text-[12.5px] font-bold text-ink/80 transition hover:border-gold hover:text-gold sm:block"
          >
            Thekedar OS
          </Link>
          <a href="#contact" className="group hidden items-center gap-2 rounded-full bg-gold px-4 py-2 text-[12.5px] font-extrabold text-night transition hover:bg-goldsoft sm:flex">
            Get a quote
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <button onClick={onMenu} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-line text-ink lg:hidden" aria-label="Menu">
            <Menu size={19} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-night/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-mono text-[11px] tracking-[0.3em] text-gold uppercase">Menu</span>
            <button onClick={onClose} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-line text-ink" aria-label="Close"><X size={19} /></button>
          </div>
          <nav className="mt-6 flex flex-col px-5">
            {navLinks.map((l, i) => (
              <motion.a
                key={l.href} href={l.href} onClick={onClose}
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}
                className="headline-xl border-b border-line/60 py-5 text-4xl text-ink"
              >
                {l.label}
              </motion.a>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-8 flex gap-3">
              <Link to="/login" onClick={onClose} className="flex-1 rounded-full border border-line py-3 text-center text-sm font-bold text-ink">Thekedar OS</Link>
              <a href="#contact" onClick={onClose} className="flex-1 rounded-full bg-gold py-3 text-center text-sm font-extrabold text-night">Get a quote</a>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────── hero ─────────────────────────
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 sm:pt-28">
      {/* image marquee band */}
      <div className="marquee-paused relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-night to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-night to-transparent sm:w-28" />
        <div className="flex w-max animate-marquee-slow gap-3 px-3">
          {[...heroStrip, ...heroStrip].map((n, i) => (
            <div key={i} className="img-zoom h-[190px] w-[240px] shrink-0 overflow-hidden rounded-md sm:h-[260px] sm:w-[340px]">
              <img src={IMG(n)} alt="" loading="eager" className="h-full w-full object-cover opacity-85 saturate-[0.85]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        {/* intro + ticker */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <Reveal>
            <p className="max-w-2xl text-lg leading-relaxed font-medium text-ink/75 sm:text-xl">
              We are experts in civil construction, infrastructure and turnkey projects.
              From a villa's first footing to a flyover's last girder — we build structures
              that outlive the people who build them.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.26em] text-ink/45 uppercase lg:justify-end">
              <span className="text-gold">Est. 2009</span>
              <span>Dahegam · Gujarat</span>
              <span>GSTIN verified</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-gold" /> Zero LTI</span>
            </div>
          </Reveal>
        </div>

        {/* counter strip */}
        <div className="mt-8 overflow-hidden border-y border-line/60 py-3">
          <div className="flex w-max animate-marquee-fast gap-0 font-mono text-[12px] tracking-[0.3em] text-ink/40 uppercase">
            {Array.from({ length: 2 }).map((_, r) => (
              <span key={r} className="flex shrink-0">
                {['120+ projects', '16 years', '4.8L sq.ft built', '350 workers on roll', 'zero lost-time incidents', '22 machines owned'].map((s) => (
                  <span key={s} className="flex items-center"><span className="px-5">{s}</span><span className="text-gold">. .</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* headline + collage */}
        <div className="mt-14 grid gap-12 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <h1 className="headline-xl text-[13vw] leading-[0.9] sm:text-[7.5vw] lg:text-[5.6vw]">
              <StaggerWords text="We are —" delay={0.2} />
              <br />
              <span className="text-gold"><StaggerWords text="concrete, steel," delay={0.45} /></span>
              <br />
              <span className="outline-type"><StaggerWords text="commitment" delay={0.7} /></span>
            </h1>
            <Reveal delay={0.5} className="mt-8 max-w-md">
              <p className="text-[15px] leading-relaxed font-medium text-ink/60">
                A family-run contracting house from Dahegam, Gujarat. One team, one standard —
                whether it is a 3,000 sq.ft home or a 1.4 km flyover approach.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#work" className="group flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[13px] font-extrabold text-night transition hover:bg-gold">
                  See the work <ArrowDown size={15} className="transition-transform group-hover:translate-y-0.5" />
                </a>
                <a href="#services" className="flex items-center gap-2 rounded-full border border-line px-6 py-3 text-[13px] font-bold text-ink/80 transition hover:border-gold hover:text-gold">
                  What we do
                </a>
              </div>
            </Reveal>
          </div>

          <div className="relative">
            <div className="grid grid-cols-5 grid-rows-6 gap-3" style={{ height: 'min(72vw, 560px)' }}>
              <Reveal delay={0.3} className="col-span-3 row-span-4">
                <div className="img-zoom h-full w-full overflow-hidden rounded-lg">
                  <img src={IMG('hero-sunset')} alt="Site engineer at sunset" className="h-full w-full object-cover" />
                </div>
              </Reveal>
              <Reveal delay={0.45} className="col-span-2 row-span-3">
                <div className="img-zoom h-full w-full overflow-hidden rounded-lg">
                  <img src={IMG('night-cranes')} alt="Cranes at night" className="h-full w-full object-cover" />
                </div>
              </Reveal>
              <Reveal delay={0.6} className="col-span-2 row-span-3">
                <div className="img-zoom h-full w-full overflow-hidden rounded-lg">
                  <img src={IMG('steel-sunburst')} alt="Steel structure against sun" className="h-full w-full object-cover" />
                </div>
              </Reveal>
              <Reveal delay={0.75} className="col-span-3 row-span-2">
                <div className="flex h-full w-full flex-col justify-between rounded-lg border border-line bg-cream p-4">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-gold uppercase">On site now</span>
                  <div>
                    <div className="font-display text-xl font-bold text-ink">3 live sites</div>
                    <div className="mt-1 text-[12px] font-semibold text-ink/50">24 present today · 2 cranes working</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* numbered manifesto */}
        <div className="grid gap-6 border-t border-line/60 pt-10 pb-24 sm:grid-cols-3">
          {[
            ['01', 'Turning bold drawings into load-bearing reality.'],
            ['02', 'Raising site quality with modern machinery and method.'],
            ['03', 'New generation. New technique. New landmarks.'],
          ].map(([n, t], i) => (
            <Reveal key={n} delay={i * 0.12}>
              <div className="group flex gap-4">
                <span className="font-mono text-[13px] text-gold">{n}</span>
                <p className="font-display text-lg leading-snug font-semibold text-ink/80 transition group-hover:text-ink sm:text-xl">{t}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── featured work ─────────────────────────
function Work() {
  const [active, setActive] = useState(projects[0]);
  const [modal, setModal] = useState(false);
  return (
    <section id="work" className="relative border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionTag>On site</SectionTag>
            <h2 className="headline-xl mt-4 text-[11vw] sm:text-[5vw]">
              <AnimatePresence mode="wait">
                <motion.span key={active.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.4 }} className="block">
                  {active.title}
                </motion.span>
              </AnimatePresence>
            </h2>
          </div>
          <button onClick={() => setModal(true)} className="group flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[13px] font-bold text-ink/80 transition hover:border-gold hover:text-gold">
            about project
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* collage grid */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {active.gallery.map((g, i) => (
            <motion.div
              key={`${active.id}-${g}-${i}`}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className={`img-zoom overflow-hidden rounded-lg ${i === 0 || i === 5 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img src={IMG(g)} alt={active.title} loading="lazy" className={`w-full object-cover ${i === 0 || i === 5 ? 'h-full min-h-[240px]' : 'h-[150px] sm:h-[180px]'}`} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 font-mono text-[11px] tracking-[0.2em] text-ink/50 uppercase">
            <span className="rounded-full border border-line px-3 py-1.5 text-gold">{active.tag}</span>
            <span className="rounded-full border border-line px-3 py-1.5">{active.place}</span>
            <span className="rounded-full border border-line px-3 py-1.5">{active.year}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={`cursor-pointer rounded-full px-4 py-2 text-[12.5px] font-bold transition ${active.id === p.id ? 'bg-gold text-night' : 'border border-line text-ink/60 hover:border-gold hover:text-gold'}`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* about-project modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)} className="fixed inset-0 z-[80] flex items-end justify-center bg-night/80 p-0 backdrop-blur-md sm:items-center sm:p-6">
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-cream p-6 sm:max-w-3xl sm:rounded-3xl sm:p-9"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.3em] text-gold uppercase">{active.tag} · {active.year}</div>
                  <h3 className="font-display mt-2 text-3xl font-bold text-ink">{active.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-ink/50"><MapPin size={13} /> {active.place}</p>
                </div>
                <button onClick={() => setModal(false)} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-ink/60 transition hover:border-gold hover:text-gold" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="img-zoom mt-6 overflow-hidden rounded-xl">
                <img src={IMG(active.cover)} alt={active.title} className="h-56 w-full object-cover sm:h-72" />
              </div>

              <h4 className="font-mono mt-7 text-[11px] tracking-[0.3em] text-gold uppercase">Brief</h4>
              <p className="mt-2 text-[15px] leading-relaxed font-medium text-ink/80">{active.brief}</p>
              <h4 className="font-mono mt-6 text-[11px] tracking-[0.3em] text-gold uppercase">Scope of work</h4>
              <p className="mt-2 text-[14px] leading-relaxed font-medium text-ink/65">{active.scope}</p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {active.specs.map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-line bg-night2 p-3.5">
                    <div className="font-mono text-[10px] tracking-[0.24em] text-ink/45 uppercase">{k}</div>
                    <div className="font-display mt-1 text-[15px] font-bold text-gold">{v}</div>
                  </div>
                ))}
              </div>

              <a href="#contact" onClick={() => setModal(false)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[13px] font-extrabold text-night transition hover:bg-goldsoft">
                Build something like this <ArrowRight size={15} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ───────────────────────── statement marquee ─────────────────────────
function Statement() {
  return (
    <section className="overflow-hidden border-t border-line/60 py-20">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionTag>The people behind Sarvotam</SectionTag>
      </div>
      <div className="marquee-paused mt-8 flex w-max items-center gap-8 animate-marquee">
        {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className={`font-display text-[9vw] font-bold whitespace-nowrap sm:text-[4.6vw] ${i % 3 === 1 ? 'outline-type' : 'text-ink'}`}>{w.t}</span>
            {w.img && (
              <span className="img-zoom h-[13vw] w-[16vw] shrink-0 overflow-hidden rounded-full sm:h-[6.5vw] sm:w-[8vw]">
                <img src={IMG(w.img)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-[1500px] px-5 sm:px-8">
        <a href="#team" className="group inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-[13px] font-bold text-ink/80 transition hover:border-gold hover:text-gold">
          Meet the team <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

// ───────────────────────── team ─────────────────────────
function Team() {
  return (
    <section id="team" className="border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionTag>Our team</SectionTag>
            <h2 className="headline-xl mt-4 text-[11vw] sm:text-[4.6vw]">Hands that<br /><span className="text-gold">hold the line</span></h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed font-medium text-ink/55">
            Engineers, supervisors, masons and machine operators — most of them with us for
            over a decade. Sites change; the standard doesn't.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.07}>
              <div className="group">
                <div className="img-zoom relative aspect-[3/4] overflow-hidden rounded-lg">
                  <img src={IMG(m.img)} alt={m.name} loading="lazy" className="h-full w-full object-cover grayscale transition duration-700 group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.22em] text-gold uppercase">{m.note}</span>
                </div>
                <h3 className="font-display mt-3 text-[15px] leading-tight font-bold text-ink">{m.name}</h3>
                <p className="mt-0.5 text-[12px] font-semibold text-ink/50">{m.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── careers band ─────────────────────────
function Careers() {
  return (
    <section id="careers" className="relative overflow-hidden border-t border-line/60">
      <div className="img-zoom absolute inset-0">
        <img src={IMG('crew-group')} alt="" loading="lazy" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-night via-night/70 to-night" />
      </div>
      <div className="relative mx-auto max-w-[1500px] px-5 py-28 sm:px-8">
        <SectionTag>Creating the skyline together</SectionTag>
        <h2 className="headline-xl mt-5 text-[13vw] sm:text-[6.5vw]">Join us</h2>
        <Reveal delay={0.15}>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed font-medium text-ink/70">
            We are always looking for good hands and sharp eyes — engineers, supervisors,
            machine operators and masons who care about a plumb wall and a clean site.
            If that is you, the gate is open.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#contact" className="group flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-[13.5px] font-extrabold text-night transition hover:bg-goldsoft">
              Join the crew <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <span className="font-mono text-[11px] tracking-[0.26em] text-ink/45 uppercase">Open roles: site engineer · surveyor · crane operator</span>
          </div>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            [16, '+', 'years on site'],
            [120, '+', 'projects delivered'],
            [480000, '', 'sq.ft built'],
            [350, '+', 'workers on roll'],
          ].map(([v, s, l], i) => (
            <Reveal key={String(l)} delay={i * 0.1}>
              <div className="border-l border-gold/40 pl-4">
                <div className="font-display text-3xl font-bold text-ink sm:text-4xl">
                  <CountUp to={Number(v)} suffix={String(s)} />
                </div>
                <div className="mt-1 font-mono text-[10.5px] tracking-[0.24em] text-ink/45 uppercase">{String(l)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── services ─────────────────────────
function Services() {
  const [open, setOpen] = useState(0);
  return (
    <section id="services" className="border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionTag>Our services</SectionTag>
        <h2 className="headline-xl mt-4 text-[11vw] sm:text-[5vw]">Beyond bricks<br /><span className="outline-type">& mortar</span></h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed font-medium text-ink/60">
          Full-spectrum contracting — one team takes your project from soil test to
          handover, so the buck never stops anywhere but with us.
        </p>

        <div className="mt-12 grid gap-3 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors duration-300 ${open === i ? 'border-gold/60 bg-cream' : 'border-line bg-night2 hover:border-ink/30'}`}
              >
                <div className="img-zoom h-44 w-full overflow-hidden sm:h-52">
                  <img src={IMG(s.img)} alt={s.title} loading="lazy" className={`h-full w-full object-cover transition duration-700 ${open === i ? 'grayscale-0' : 'grayscale-[0.6]'}`} />
                  <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-t from-night2 via-night2/30 to-transparent sm:h-52" />
                </div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-night">{s.icon}</span>
                    <span className="font-mono text-[11px] text-ink/40">0{i + 1}</span>
                  </div>
                  <h3 className="font-display mt-4 text-2xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-ink/60">{s.desc}</p>
                  <AnimatePresence initial={false}>
                    {open === i && (
                      <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                        <div className="mt-4 space-y-2 border-t border-line/70 pt-4">
                          {s.points.map((p) => (
                            <li key={p} className="flex items-center gap-2.5 text-[13px] font-semibold text-ink/75">
                              <BadgeCheck size={15} className="shrink-0 text-gold" /> {p}
                            </li>
                          ))}
                        </div>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.24em] text-gold uppercase">
                    {open === i ? 'tap to close' : 'tap to expand'} <ArrowDown size={13} className={`transition-transform ${open === i ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── process strip ─────────────────────────
function Process() {
  const steps = [
    ['Survey & soil test', 'Every job starts with ground truth — levels, bearing, boundaries.'],
    ['Estimate & BOQ', 'Itemised rates, no hidden lines. You approve before we spend.'],
    ['Build & report', 'Daily attendance, material logs and photo proof on your phone.'],
    ['Finish & handover', 'Snag-free handover with drawings, warranties and accounts closed.'],
  ];
  return (
    <section className="border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionTag>How we work</SectionTag>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08} className="h-full">
              <div className="group h-full bg-night2 p-7 transition-colors hover:bg-cream">
                <div className="font-mono text-[11px] text-gold">0{i + 1}</div>
                <h3 className="font-display mt-3 text-xl font-bold text-ink">{t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-ink/55">{d}</p>
                <Ruler size={18} className="mt-6 text-ink/25 transition group-hover:text-gold" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── contact ─────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = 'Please tell us your name';
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) er.phone = 'A reachable phone number, please';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = 'That email doesn\'t look right';
    if (form.message.trim().length < 10) er.message = 'A line or two about your project helps';
    setErrors(er);
    if (Object.keys(er).length === 0) setSent(true);
  };
  const field = 'w-full rounded-xl border border-line bg-night2 px-4 py-3.5 text-[14px] font-medium text-ink outline-none transition placeholder:text-ink/30 focus:border-gold focus:ring-2 focus:ring-gold/20';
  return (
    <section id="contact" className="border-t border-line/60 py-24">
      <div className="mx-auto grid max-w-[1500px] gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionTag>Contact us</SectionTag>
          <h2 className="headline-xl mt-4 text-[12vw] sm:text-[5.2vw]">Drop us<br /><span className="text-gold">a line!</span></h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed font-medium text-ink/60">
            Tell us about the plot, the dream or the deadline. We reply within one working
            day — usually with a site visit date.
          </p>
          <div className="mt-9 space-y-4">
            {[
              { icon: <MapPin size={17} />, t: 'Survey 118/2, Dahegam–Gandhinagar Rd, Dahegam, Gujarat 382305' },
              { icon: <Phone size={17} />, t: '+91 98250 41188' },
              { icon: <Mail size={17} />, t: 'site@sarvotamconstruction.in' },
              { icon: <CalendarClock size={17} />, t: 'Mon–Sat · 08:00–19:00 IST' },
            ].map((c) => (
              <div key={c.t} className="flex items-center gap-3.5 text-[13.5px] font-semibold text-ink/70">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-gold">{c.icon}</span>
                {c.t}
              </div>
            ))}
          </div>
          <div className="img-zoom mt-10 hidden overflow-hidden rounded-2xl lg:block">
            <img src={IMG('duo-blueprint')} alt="Engineers reviewing drawings" loading="lazy" className="h-56 w-full object-cover" />
          </div>
        </div>

        <div className="relative rounded-3xl border border-line bg-cream p-6 sm:p-9">
          <div className="blueprint pointer-events-none absolute inset-0 rounded-3xl opacity-70" />
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-night"><BadgeCheck size={30} /></span>
              <h3 className="font-display mt-5 text-2xl font-bold text-ink">Message received!</h3>
              <p className="mt-2 max-w-xs text-[14px] font-medium text-ink/60">
                Thanks {form.name.split(' ')[0]} — our team will call you on {form.phone} within one working day.
              </p>
              <button onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', message: '' }); }} className="mt-7 rounded-full border border-line px-6 py-2.5 text-[13px] font-bold text-ink/75 transition hover:border-gold hover:text-gold">
                Send another
              </button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="relative space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <input className={field} placeholder="Your name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  {errors.name && <p className="mt-1.5 text-[12px] font-semibold text-clay">{errors.name}</p>}
                </div>
                <div>
                  <input className={field} placeholder="Phone *" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  {errors.phone && <p className="mt-1.5 text-[12px] font-semibold text-clay">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <input className={field} placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {errors.email && <p className="mt-1.5 text-[12px] font-semibold text-clay">{errors.email}</p>}
              </div>
              <div>
                <textarea rows={5} maxLength={600} className={`${field} resize-none`} placeholder="Plot size, location, what you want to build… *" value={form.message} onChange={(e) => set('message', e.target.value)} />
                <div className="mt-1.5 flex items-center justify-between">
                  {errors.message ? <p className="text-[12px] font-semibold text-clay">{errors.message}</p> : <span />}
                  <span className="font-mono text-[10.5px] text-ink/35">{form.message.length}/600</span>
                </div>
              </div>
              <button type="submit" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 text-[14px] font-extrabold text-night transition hover:bg-goldsoft">
                Send enquiry <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-center font-mono text-[10.5px] tracking-[0.2em] text-ink/35 uppercase">No spam · no sharing · one reply</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── footer ─────────────────────────
function Footer() {
  const clock = useClock();
  return (
    <footer className="grain relative overflow-hidden border-t border-line/60 bg-night pt-16">
      <div className="relative z-10 mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-10 pb-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold">
                <svg viewBox="0 0 32 32" className="h-6 w-6"><path d="M7 22 L16 8 L25 22 Z" fill="#0d0e12" /><rect x="10.5" y="22" width="11" height="3" rx="1" fill="#0d0e12" /></svg>
              </span>
              <span className="leading-none">
                <span className="font-display block text-lg font-bold text-ink">SARVOTAM</span>
                <span className="font-mono block text-[9.5px] tracking-[0.34em] text-gold uppercase">Construction</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed font-medium text-ink/50">
              Civil construction, infrastructure and turnkey projects from Dahegam, Gujarat.
              Building since 2009 — one site, one standard at a time.
            </p>
            <div className="mt-6 flex gap-2.5">
              {[<Globe key="g" size={16} />, <MessageCircle key="w" size={16} />, <Send key="s" size={16} />, <Phone key="p" size={16} />].map((ic, i) => (
                <a key={i} href="#contact" aria-label="social link" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/60 transition hover:border-gold hover:text-gold">
                  {ic}
                </a>
              ))}
            </div>
          </div>
          {[
            { h: 'Company', ls: [['Work', '#work'], ['Services', '#services'], ['Team', '#team'], ['Careers', '#careers']] },
            { h: 'Portals', ls: [['Owner login', '/login'], ['Client portal', '/login'], ['Worker portal', '/login'], ['Supervisor portal', '/login']] },
            { h: 'Contact', ls: [['+91 98250 41188', '#contact'], ['site@sarvotamconstruction.in', '#contact'], ['Dahegam, Gujarat', '#contact'], [`Local time ${clock}`, '#contact']] },
          ].map((col) => (
            <div key={col.h}>
              <h4 className="font-mono text-[11px] tracking-[0.3em] text-gold uppercase">{col.h}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.ls.map(([l, href]) => (
                  <li key={l}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="text-[13.5px] font-semibold text-ink/60 transition hover:text-gold">{l}</Link>
                    ) : (
                      <a href={href} className="text-[13.5px] font-semibold text-ink/60 transition hover:text-gold">{l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* giant wordmark */}
        <div className="relative select-none overflow-hidden">
          <div className="headline-xl outline-type text-center text-[19vw] leading-[0.8] whitespace-nowrap">SARVOTAM</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 py-6 font-mono text-[10.5px] tracking-[0.22em] text-ink/40 uppercase">
          <span>© {new Date().getFullYear()} Sarvotam Construction · Dahegam</span>
          <span className="flex items-center gap-2"><HardHat size={13} className="text-gold" /> Built with pride in Gujarat</span>
          <a href="#top" className="flex items-center gap-1.5 transition hover:text-gold">Back to top <ArrowDown size={13} className="rotate-180" /></a>
        </div>
      </div>
    </footer>
  );
}

// ───────────────────────── page ─────────────────────────
export default function Landing() {
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1500);
    document.body.style.overflow = loaded ? '' : 'hidden';
    return () => { clearTimeout(t); document.body.style.overflow = ''; };
  }, [loaded]);

  return (
    <div className="grain relative min-h-screen bg-paper text-ink">
      <Preloader done={loaded} />
      <motion.div style={{ scaleX: bar }} className="fixed inset-x-0 top-0 z-[60] h-[2.5px] origin-left bg-gold" />
      <Header onMenu={() => setMenu(true)} />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <main className="relative z-10">
        <Hero />
        <Work />
        <Statement />
        <Team />
        <Careers />
        <Services />
        <Process />
        <Contact />
      </main>
      <Footer />
      {/* floating OS chip */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: loaded ? 1 : 0, y: 0 }} transition={{ delay: 0.4 }}
        className="fixed right-5 bottom-5 z-40 hidden items-center gap-3 rounded-2xl border border-line bg-night/85 py-2.5 pr-4 pl-2.5 backdrop-blur-xl sm:flex"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-night"><Sparkles size={17} /></span>
        <span className="leading-tight">
          <span className="block text-[12px] font-extrabold text-ink">Run your site on Thekedar OS</span>
          <span className="block text-[11px] font-semibold text-ink/50">Attendance · materials · money · photo proof</span>
        </span>
        <Link to="/login" className="ml-2 rounded-full bg-ink px-4 py-2 text-[12px] font-extrabold text-night transition hover:bg-gold">Open</Link>
      </motion.div>
    </div>
  );
}
