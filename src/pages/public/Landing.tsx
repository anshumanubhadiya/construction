// ─── Public landing · Sarvotam Construction, Dahegam ───
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Banknote, BarChart3, Bell, Building2, CalendarCheck,
  FileText, HardHat, Lock, MapPin, Package, Phone, Play, ShieldCheck, Sparkles, Truck, Mail, ChevronRight,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/ui';

// ── word-stagger headline ──
function StaggerWords({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 26, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: delay + i * 0.09, type: 'spring', stiffness: 200, damping: 22 }}
        >
          {w}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

// ── count-up on view ──
function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
}

// ── hero dashboard mock ──
function HeroMock() {
  const bars = [42, 68, 50, 82, 60, 94, 74];
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="card-night relative overflow-hidden rounded-3xl p-5 shadow-2xl shadow-black/50 sm:p-6"
        style={{ perspective: 1000 }}
      >
        <div className="blueprint-dark pointer-events-none absolute inset-0" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-extrabold tracking-[0.2em] text-gold uppercase">September P&L</div>
            <div className="font-display mt-1 text-3xl font-bold text-white">₹4,86,200</div>
            <div className="mt-0.5 text-xs font-bold text-emerald-400">▲ Net profit +18.2%</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-night"><BarChart3 size={24} /></div>
        </div>
        <div className="relative mt-5 flex h-32 items-end gap-2.5">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.8 + i * 0.09, type: 'spring', stiffness: 160, damping: 20 }}
              className={`flex-1 rounded-t-lg ${i === 5 ? 'bg-gradient-to-t from-golddeep to-gold' : 'bg-white/12'}`}
            />
          ))}
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2.5">
          {[{ l: 'Income', v: '₹7.2L' }, { l: 'Workers', v: '24 paid' }, { l: 'Sites', v: '3 live' }].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/6 px-3 py-2.5 ring-1 ring-white/10 ring-inset">
              <div className="text-[10px] font-extrabold tracking-wider text-white/45 uppercase">{s.l}</div>
              <div className="text-sm font-extrabold text-white">{s.v}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* floating cards */}
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }}
        className="animate-floaty absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-2xl border border-line bg-[#fffdf7] p-3 pr-5 shadow-xl sm:flex"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><CalendarCheck size={20} /></div>
        <div><div className="text-[13px] font-extrabold">Attendance marked</div><div className="text-[11.5px] font-semibold text-ink/50">24 present · 2 half-day</div></div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.25 }}
        className="animate-floaty-slow absolute -top-5 -right-2 hidden items-center gap-3 rounded-2xl bg-night p-3 pr-5 text-white shadow-xl sm:flex"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-night"><BadgeCheck size={20} /></div>
        <div><div className="text-[13px] font-extrabold">Bill approved</div><div className="text-[11.5px] font-semibold text-white/55">EST-2026-013 · ₹3.34L</div></div>
      </motion.div>
    </div>
  );
}

const features = [
  { icon: <HardHat size={24} />, title: 'Worker Attendance', desc: 'Daily site attendance with half-days, advances and auto salary sheets.', bg: 'bg-skywash', fg: 'text-steel' },
  { icon: <Package size={24} />, title: 'Material & Stock', desc: 'Cement to steel — purchases, vendors, bills and live stock levels.', bg: 'bg-amberwash', fg: 'text-golddeep' },
  { icon: <Banknote size={24} />, title: 'Income Tracking', desc: 'Every client receipt recorded with mode, project and reference.', bg: 'bg-mint', fg: 'text-forest' },
  { icon: <BarChart3 size={24} />, title: 'Live P&L Reports', desc: 'Real profit per project and per month — no more guesswork.', bg: 'bg-plumwash', fg: 'text-plum' },
  { icon: <FileText size={24} />, title: 'PDF Estimates & Bills', desc: 'Professional GST estimates and reports, printed in one click.', bg: 'bg-tealwash', fg: 'text-tealpop' },
  { icon: <Lock size={24} />, title: 'Role-Based Access', desc: 'Owner, client, worker and supervisor — everyone sees only their world.', bg: 'bg-blush', fg: 'text-clay' },
];

const steps = [
  { n: '01', title: 'Add your site & team', desc: 'Create the project, add the client party and register workers with daily rates.', icon: <Building2 size={22} /> },
  { n: '02', title: 'Record daily work', desc: 'Mark attendance, enter material purchases and log income in under a minute.', icon: <CalendarCheck size={22} /> },
  { n: '03', title: 'Watch profit grow', desc: 'Auto P&L, salary sheets and PDF reports keep every rupee accounted.', icon: <BarChart3 size={22} /> },
];

type RoleTab = 'Admin' | 'Client' | 'Worker' | 'Supervisor';
const roleTabs: { id: RoleTab; desc: string; points: string[]; cta: string }[] = [
  { id: 'Admin', desc: 'The owner cockpit — every site, every rupee, every worker.', points: ['Live P&L with charts & alerts', 'Projects, materials, vehicles, estimates', 'One-click PDF reports & salary sheets'], cta: 'Open owner portal' },
  { id: 'Client', desc: 'Your customers see professionalism, not paperwork chaos.', points: ['Their project progress & budgets', 'Estimates with GST + download PDF', 'Full payment history & balance'], cta: 'Open client portal' },
  { id: 'Worker', desc: 'Workers check their own days, earnings and advances.', points: ['Month calendar of attendance', 'Earnings minus advances, clearly shown', 'Salary slip download as PDF'], cta: 'Open worker portal' },
  { id: 'Supervisor', desc: 'Site supervisors mark attendance — nothing financial.', points: ['Fast daily attendance marking', 'Material entry from site', 'No access to income or profits'], cta: 'Open supervisor portal' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<RoleTab>('Admin');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-paper">
      {/* ── nav ── */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'border-b border-line bg-paper/90 backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/"><Logo /></Link>
          <div className="ml-8 hidden items-center gap-7 text-[13.5px] font-bold text-ink/60 lg:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#roles" className="transition hover:text-ink">Who is it for</a>
            <a href="#contact" className="transition hover:text-ink">Contact</a>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-extrabold text-ink/70 transition hover:bg-ink/5 sm:block">Login</Link>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/signup')}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-night px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-black/20 sm:px-5"
            >
              Start Free <ArrowRight size={16} className="text-gold" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── hero ── */}
      <section className="relative overflow-hidden bg-night pt-28 pb-16 text-white sm:pt-36 sm:pb-24">
        <div className="blueprint-dark pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-gold/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 -left-40 h-[420px] w-[420px] rounded-full bg-forest/25 blur-[120px]" />
        <div className="grain relative mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-xs font-extrabold tracking-wide text-gold ring-1 ring-gold/30 ring-inset"
            >
              <Sparkles size={14} /> DAHEGAM · GUJARAT · SINCE 2016
            </motion.div>
            <h1 className="font-display mt-5 text-[42px] leading-[1.02] font-bold sm:text-6xl lg:text-[68px]">
              <StaggerWords text="Build more." delay={0.1} /><br />
              <span className="text-gold"><StaggerWords text="Track everything." delay={0.35} /></span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="mt-5 max-w-lg text-[15.5px] leading-relaxed font-medium text-white/65"
            >
              Sarvotam Construction runs your entire contracting business — workers, materials,
              income, expenses, vehicles and reports — in one beautiful dashboard.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gold px-7 py-3.5 text-[15px] font-extrabold text-night shadow-xl shadow-gold/25"
              >
                <Play size={17} /> Open the Portal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/signup')}
                className="cursor-pointer rounded-2xl border-[1.5px] border-white/20 px-7 py-3.5 text-[15px] font-extrabold text-white transition hover:border-gold/60 hover:bg-white/5"
              >
                Create Account
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6"
            >
              {[
                { v: <CountUp to={120} suffix="+" />, l: 'Projects delivered' },
                { v: <CountUp to={850} suffix="+" />, l: 'Workers managed' },
                { v: <><CountUp to={12} prefix="₹" suffix=" Cr+" /></>, l: 'Billing tracked' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl font-bold text-gold sm:text-[26px]">{s.v}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug font-bold text-white/50">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>
          <HeroMock />
        </div>

        {/* marquee */}
        <div className="relative mt-14 overflow-hidden border-y border-white/10 bg-black/30 py-3.5">
          <div className="animate-marquee flex w-max items-center gap-10 pr-10 text-[13px] font-extrabold tracking-[0.18em] whitespace-nowrap text-white/50 uppercase">
            {Array(2).fill(['Residential Bungalows', 'Commercial Complexes', 'Renovation & Repair', 'RCC & Structure Work', 'Waterproofing', 'Turnkey Projects']).flat().map((t, i) => (
              <span key={i} className="flex items-center gap-10">{t}<span className="text-gold">◆</span></span>
            ))}
          </div>
        </div>
      </section>

      {/* ── features ── */}
      <section id="features" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="max-w-2xl">
          <div className="text-xs font-extrabold tracking-[0.2em] text-golddeep uppercase">Everything in one place</div>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-[42px] sm:leading-[1.1]">One dashboard for the <span className="text-golddeep">whole site.</span></h2>
          <p className="mt-3 text-[15px] font-medium text-ink/55">Stop juggling diaries, WhatsApp and Excel. Every entry flows straight into profit.</p>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.45 }}
              whileHover={{ y: -6 }}
              className="card-paper tap-lift group rounded-3xl p-6"
            >
              <div className={`grid h-13 w-13 place-items-center rounded-2xl p-3 ${f.bg} ${f.fg} transition-transform group-hover:scale-110 group-hover:rotate-3`}>{f.icon}</div>
              <h3 className="font-display mt-4 text-[19px] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed font-medium text-ink/55">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── how it works ── */}
      <section id="how" className="border-y border-line bg-cream/60">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center">
            <div className="text-xs font-extrabold tracking-[0.2em] text-golddeep uppercase">Simple workflow</div>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-[42px]">From site diary to <span className="text-golddeep">profit report.</span></h2>
          </motion.div>
          <div className="relative mt-12 grid gap-4 md:grid-cols-3">
            <div className="absolute top-16 right-[12%] left-[12%] hidden border-t-2 border-dashed border-golddeep/30 md:block" />
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12 }}
                className="card-paper relative rounded-3xl p-7 text-center"
              >
                <div className="font-display absolute top-5 right-6 text-5xl font-bold text-ink/6">{s.n}</div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-night text-gold shadow-lg shadow-black/20">{s.icon}</div>
                <div className="mt-4 text-xs font-extrabold tracking-[0.18em] text-golddeep uppercase">Step {s.n}</div>
                <h3 className="font-display mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-ink/55">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── role showcase ── */}
      <section id="roles" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="max-w-2xl">
          <div className="text-xs font-extrabold tracking-[0.2em] text-golddeep uppercase">Four portals, one system</div>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-[42px] sm:leading-[1.1]">Everyone sees <span className="text-golddeep">their own world.</span></h2>
        </motion.div>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {roleTabs.map((r) => (
            <button
              key={r.id}
              onClick={() => setTab(r.id)}
              className={`relative cursor-pointer rounded-2xl px-5 py-3 text-sm font-extrabold transition ${tab === r.id ? 'text-white' : 'bg-ink/5 text-ink/55 hover:bg-ink/10'}`}
            >
              {tab === r.id && (
                <motion.span layoutId="role-pill" className="absolute inset-0 rounded-2xl bg-night" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
              )}
              <span className="relative">{r.id}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="card-night grain relative mt-5 grid overflow-hidden rounded-3xl p-7 sm:p-10 lg:grid-cols-2"
          >
            <div className="relative">
              <div className="text-xs font-extrabold tracking-[0.2em] text-gold uppercase">{tab} portal</div>
              <h3 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">{roleTabs.find((r) => r.id === tab)?.desc}</h3>
              <ul className="mt-5 space-y-3">
                {roleTabs.find((r) => r.id === tab)?.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[14.5px] font-semibold text-white/75">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><ChevronRight size={15} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-extrabold text-night transition hover:brightness-105"
              >
                {roleTabs.find((r) => r.id === tab)?.cta} <ArrowRight size={16} />
              </button>
            </div>
            <div className="relative mt-8 hidden items-center justify-center lg:mt-0 lg:flex">
              <MiniMock tab={tab} />
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── real accounts ── */}
      <section className="border-y border-line bg-night text-white">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-gold uppercase"><ShieldCheck size={15} /> Real accounts · real security</div>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Your site data, safe in the cloud.</h2>
            <p className="mt-3 max-w-md text-[14.5px] font-medium text-white/60">Every account is a real, password-protected login seen only by you and your team. Clients and workers get access only after the owner approves them.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate('/signup')} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-extrabold text-night transition hover:brightness-105">
                Create an account <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/login')} className="cursor-pointer rounded-2xl border-[1.5px] border-white/20 px-6 py-3 text-sm font-extrabold text-white/85 transition hover:border-gold hover:text-gold">
                I already have one
              </button>
            </div>
          </motion.div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              { r: 'Owner / Admin', t: 'Full control of sites, money, users and settings.' },
              { r: 'Client', t: 'Only their projects, bills, payments and photo updates.' },
              { r: 'Worker', t: 'Only their own attendance calendar and earnings.' },
              { r: 'Supervisor / Staff', t: 'Mark attendance and materials on site — nothing financial.' },
            ].map((d, i) => (
              <motion.div
                key={d.r}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10 ring-inset"
              >
                <div className="text-[11px] font-extrabold tracking-widest text-gold uppercase">{d.r}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-white/65">{d.t}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── contact ── */}
      <section id="contact" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-xs font-extrabold tracking-[0.2em] text-golddeep uppercase">Visit or call us</div>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-[40px] sm:leading-[1.1]">Based in Dahegam.<br />Working across Gujarat.</h2>
            <p className="mt-3 max-w-md text-[15px] font-medium text-ink/55">Residential, commercial and renovation projects — from estimate to handover, fully transparent.</p>
            <div className="mt-6 space-y-3">
              {[
                { icon: <MapPin size={18} />, t: 'Station Road, Dahegam, Dist. Gandhinagar, Gujarat 382305' },
                { icon: <Phone size={18} />, t: '+91 98765 43210 · Mon–Sat, 9am–7pm' },
                { icon: <Mail size={18} />, t: 'contact@sarvotamconstruction.in' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-ink/75">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amberwash text-golddeep">{c.icon}</span>
                  {c.t}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="card-paper relative overflow-hidden rounded-3xl p-7"
          >
            <div className="blueprint pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-night text-gold"><Truck size={22} /></div>
                <div>
                  <div className="font-display text-lg font-bold">Get a free site estimate</div>
                  <div className="text-[13px] font-semibold text-ink/50">Response within 24 hours</div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input placeholder="Your name" className="field" />
                <input placeholder="Phone number" className="field" />
                <input placeholder="Plot / site location" className="field sm:col-span-2" />
                <textarea placeholder="Tell us about your project…" rows={3} className="field resize-none sm:col-span-2" />
              </div>
              <button onClick={() => navigate('/signup')} className="mt-4 w-full cursor-pointer rounded-2xl bg-night py-3.5 text-sm font-extrabold text-white transition hover:bg-ink2">
                Request Callback
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-ink/45"><Bell size={13} /> Or create a client account to track everything online</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="bg-night text-white">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed font-medium text-white/50">Professional construction account management — built for Indian contractors, by people who understand the site.</p>
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-widest text-gold uppercase">Product</div>
            <div className="mt-3 space-y-2 text-sm font-semibold text-white/60">
              <Link to="/login" className="block hover:text-white">Login</Link>
              <Link to="/signup" className="block hover:text-white">Create account</Link>
              <a href="#features" className="block hover:text-white">Features</a>
              <a href="#roles" className="block hover:text-white">Portals</a>
            </div>
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-widest text-gold uppercase">Company</div>
            <div className="mt-3 space-y-2 text-sm font-semibold text-white/60">
              <div>Station Road, Dahegam 382305</div>
              <div>+91 98765 43210</div>
              <div>contact@sarvotamconstruction.in</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs font-semibold text-white/40 sm:px-6">
            <span>© 2026 Sarvotam Construction · Dahegam, Gujarat</span>
            <span>Made with care for Indian contractors</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── mini mock per role ──
function MiniMock({ tab }: { tab: RoleTab }) {
  if (tab === 'Admin') {
    return (
      <div className="w-full max-w-[320px] rounded-2xl bg-white/8 p-5 ring-1 ring-white/12 ring-inset">
        <div className="text-[11px] font-extrabold tracking-widest text-gold uppercase">Owner overview</div>
        <div className="font-display mt-1 text-3xl font-bold text-white">₹4.86L</div>
        <div className="mt-4 space-y-2.5">
          {[{ l: 'Sharma Residence', v: 62, c: '#E8A20C' }, { l: 'City Plaza Shops', v: 34, c: '#2dd4bf' }, { l: 'Farmhouse', v: 48, c: '#b57bee' }].map((p) => (
            <div key={p.l}>
              <div className="mb-1 flex justify-between text-[11.5px] font-bold text-white/60"><span>{p.l}</span><span>{p.v}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${p.v}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ background: p.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === 'Client') {
    return (
      <div className="w-full max-w-[320px] rounded-2xl bg-[#fffdf7] p-5 text-ink shadow-2xl">
        <div className="text-[11px] font-extrabold tracking-widest text-golddeep uppercase">Estimate EST-2026-014</div>
        <div className="font-display mt-1 text-2xl font-bold">₹3,35,946</div>
        <div className="mt-3 space-y-2">
          {[['RCC work', '₹1,04,000'], ['Brickwork', '₹85,500'], ['Plaster & paint', '₹95,200']].map(([a, b]) => (
            <div key={a} className="flex justify-between border-b border-line pb-2 text-[12.5px] font-bold"><span className="text-ink/60">{a}</span><span>{b}</span></div>
          ))}
        </div>
        <div className="mt-3 inline-flex rounded-full bg-skywash px-3 py-1 text-[11px] font-extrabold text-steel">SENT · AWAITING APPROVAL</div>
      </div>
    );
  }
  if (tab === 'Worker') {
    const days = ['P', 'P', 'P', 'H', 'P', 'A', 'P', 'P', 'P', 'P', 'H', 'P', 'P', 'P'];
    return (
      <div className="w-full max-w-[320px] rounded-2xl bg-white/8 p-5 ring-1 ring-white/12 ring-inset">
        <div className="text-[11px] font-extrabold tracking-widest text-gold uppercase">September earnings</div>
        <div className="font-display mt-1 text-3xl font-bold text-white">₹9,300</div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className={`grid h-8 place-items-center rounded-lg text-[11px] font-extrabold ${d === 'P' ? 'bg-emerald-400/25 text-emerald-300' : d === 'H' ? 'bg-gold/25 text-gold' : 'bg-clay/25 text-red-300'}`}
            >
              {d}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-[320px] rounded-2xl bg-white/8 p-5 ring-1 ring-white/12 ring-inset">
      <div className="text-[11px] font-extrabold tracking-widest text-gold uppercase">Today · Sharma Residence</div>
      <div className="mt-3 space-y-2">
        {[['Ramesh Kumar', 'Present', true], ['Suresh Thakor', 'Present', true], ['Arjun Patel', 'Half Day', false]].map(([n, s, on]) => (
          <div key={n as string} className="flex items-center justify-between rounded-xl bg-white/6 px-3 py-2.5">
            <span className="text-[13px] font-bold text-white/85">{n}</span>
            <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${on ? 'bg-emerald-400/20 text-emerald-300' : 'bg-gold/20 text-gold'}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
