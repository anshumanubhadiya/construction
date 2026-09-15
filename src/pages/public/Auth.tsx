// ─── Auth screens · real Supabase Auth: login / signup / pending / forgot / reset ───
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Building2, Eye, EyeOff, HardHat, KeyRound,
  Lock, LogIn, Mail, Phone, ShieldCheck, TicketCheck, User, UserPlus,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, SuccessCheck } from '../../components/ui';
import { completePasswordReset } from '../../services/auth';
import { toast, useApp } from '../../store/appStore';

function Shell({ children, side }: { children: ReactNode; side: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-night text-white lg:block">
        <div className="blueprint-dark pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold/15 blur-[110px]" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-forest/25 blur-[110px]" />
        <div className="relative flex h-full flex-col p-12">
          <Link to="/"><Logo dark /></Link>
          <div className="flex flex-1 flex-col justify-center">{side}</div>
          <div className="flex items-center gap-6 text-[13px] font-bold text-white/45">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-gold" /> Secure login</span>
            <span>Dahegam · Gujarat</span>
          </div>
        </div>
      </div>
      {/* form panel */}
      <div className="relative flex items-center justify-center bg-paper px-4 py-10 sm:px-10">
        <div className="blueprint pointer-events-none absolute inset-0 opacity-50" />
        <Link to="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-[13px] font-extrabold text-ink/50 transition hover:text-ink lg:hidden">
          <ArrowLeft size={16} /> Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-[420px]"
        >
          <div className="mb-6 lg:hidden"><Logo /></div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function FieldRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/35">{icon}</span>
      {children}
    </div>
  );
}

const inputWithIcon = 'field pl-10! py-3! rounded-2xl!';

/** Shown while the Supabase SQL setup hasn't been run yet (404 on probe). */
export function SetupBanner({ compact = false }: { compact?: boolean }) {
  const schemaReady = useApp((st) => st.schemaReady);
  const checkSchema = useApp((st) => st.checkSchema);
  const [busy, setBusy] = useState(false);
  if (schemaReady !== false) return null;
  return (
    <div className={`rounded-2xl border-[1.5px] border-gold/50 bg-amberwash/60 ${compact ? 'mb-4 p-3.5' : 'mb-5 p-4'}`}>
      <p className="flex items-center gap-2 text-[13px] font-extrabold text-bronze">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-[11px] text-night">!</span>
        One-time database setup is pending
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed font-semibold text-ink/60">
        {compact
          ? 'Your accounts and business data are held locally until Supabase tables exist. Run the SQL once (30 seconds) — after that everything saves to the cloud and syncs to every device.'
          : 'Run the SQL script once in Supabase (30 seconds) — after that every worker, client and attendance entry saves to the cloud automatically and syncs to all devices.'}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link to="/setup" className="rounded-xl bg-night px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:bg-ink2">Open Setup Guide</Link>
        <button
          disabled={busy}
          onClick={() => { setBusy(true); void checkSchema().finally(() => setBusy(false)); }}
          className="cursor-pointer rounded-xl border-[1.5px] border-gold/60 bg-white/70 px-3.5 py-2 text-[12px] font-extrabold text-bronze transition hover:border-gold disabled:opacity-60"
        >{busy ? 'Checking…' : 'Done? Re-check'}</button>
      </div>
    </div>
  );
}

function Err({ children }: { children: ReactNode }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-blush/70 px-3.5 py-2.5 text-[13px] font-bold text-clay">
      {children}
    </motion.p>
  );
}

// ───────── LOGIN ─────────
export function Login() {
  const navigate = useNavigate();
  const login = useApp((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      if (res.message === 'pending') { navigate('/pending'); return; }
      setError(res.message);
      return;
    }
    toast.success(res.message);
    navigate(
      res.role === 'admin' || res.role === 'staff' ? '/admin/dashboard'
      : res.role === 'client' ? '/client/dashboard'
      : res.role === 'worker' ? '/worker/dashboard'
      : '/supervisor/dashboard',
      { replace: true },
    );
  };

  return (
    <Shell
      side={
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-xs font-extrabold tracking-wide text-gold ring-1 ring-gold/30 ring-inset">
            <Building2 size={14} /> SARVOTAM OS · 4 PORTALS
          </div>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] font-bold">
            Welcome back to <span className="text-gold">the site office.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed font-medium text-white/60">
            One login for owners, clients, workers and supervisors. Your dashboard opens automatically based on your role.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[['120+', 'Projects'], ['₹12 Cr+', 'Tracked'], ['4', 'Portals']].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10 ring-inset">
                <div className="font-display text-2xl font-bold text-gold">{v}</div>
                <div className="text-xs font-bold text-white/50">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      }
    >
      <h2 className="font-display text-[28px] font-bold">Login to your account</h2>
      <p className="mt-1 text-sm font-medium text-ink/55">Enter your credentials to continue.</p>
      <div className="mt-4"><SetupBanner /></div>

      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <FieldRow icon={<Mail size={17} />}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" className={inputWithIcon} />
        </FieldRow>
        <FieldRow icon={<Lock size={17} />}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type={show ? 'text' : 'password'} autoComplete="current-password" className={`${inputWithIcon} pr-11!`} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-ink/35 hover:text-ink">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </FieldRow>

        {error && <Err>{error}</Err>}

        <div className="flex items-center justify-between text-[13px] font-bold">
          <span className="flex items-center gap-1.5 text-ink/45"><ShieldCheck size={14} className="text-forest" /> Secured by Supabase Auth</span>
          <Link to="/forgot" className="text-golddeep hover:underline">Forgot password?</Link>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-night py-3.5 text-[15px] font-extrabold text-white shadow-xl shadow-black/20 transition hover:bg-ink2 disabled:opacity-60"
        >
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" /> : <><LogIn size={18} className="text-gold" /> Login</>}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-[13.5px] font-semibold text-ink/55">
        New here? <Link to="/signup" className="font-extrabold text-golddeep hover:underline">Create an account</Link>
      </p>
      <p className="mt-1.5 text-center text-xs font-medium text-ink/40">
        First time setting up? <Link to="/setup" className="font-bold text-ink/60 underline decoration-dotted">Setup guide</Link>
      </p>
    </Shell>
  );
}

// ───────── SIGNUP ─────────
export function Signup() {
  const navigate = useNavigate();
  const signup = useApp((s) => s.signup);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', joinCode: '' });
  const [mode, setMode] = useState<'public' | 'team'>('public');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 3) return setError('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (!/^[0-9+\-\s]{10,}$/.test(form.phone.trim())) return setError('Please enter a valid phone number.');
    setBusy(true);
    const res = await signup(
      mode === 'team'
        ? { ...form, role: 'staff', joinCode: form.joinCode.trim() }
        : { ...form, role: 'client' },
    );
    setBusy(false);
    if (!res.ok) {
      if (res.message === 'pending') { navigate('/pending'); return; }
      setError(res.message);
      return;
    }
    toast.success(res.message);
    navigate(
      res.role === 'admin' || res.role === 'staff' || res.role === 'supervisor'
        ? res.role === 'supervisor' ? '/supervisor/dashboard' : '/admin/dashboard'
        : '/login',
      { replace: true },
    );
  };

  return (
    <Shell
      side={
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-xs font-extrabold tracking-wide text-gold ring-1 ring-gold/30 ring-inset">
            <UserPlus size={14} /> JOIN IN 30 SECONDS
          </div>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] font-bold">
            Your work, <span className="text-gold">beautifully tracked.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed font-medium text-white/60">
            Clients follow their project and bills. Workers follow their days and earnings. The owner approves every account for security.
          </p>
          <div className="mt-8 flex max-w-md items-center gap-4 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10 ring-inset">
            <HardHat size={28} className="shrink-0 text-gold" />
            <p className="text-[13.5px] leading-relaxed font-semibold text-white/70">Clients and workers stay <span className="text-gold">pending</span> until the owner links the login to their record. Team members with a join code get in instantly.</p>
          </div>
        </motion.div>
      }
    >
      <h2 className="font-display text-[28px] font-bold">Create your account</h2>
      <p className="mt-1 text-sm font-medium text-ink/55">Clients and workers can register here.</p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-ink/5 p-1.5">
        {([['public', 'Client / Worker'], ['team', 'Team member']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`relative cursor-pointer rounded-xl py-2.5 text-sm font-extrabold transition ${mode === key ? 'text-white' : 'text-ink/50 hover:text-ink'}`}
          >
            {mode === key && (
              <motion.span layoutId="role-seg" className="absolute inset-0 rounded-xl bg-night" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <FieldRow icon={<User size={17} />}>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={inputWithIcon} />
        </FieldRow>
        <FieldRow icon={<Phone size={17} />}>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone number" inputMode="tel" className={inputWithIcon} />
        </FieldRow>
        <FieldRow icon={<Mail size={17} />}>
          <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email address" type="email" autoComplete="email" className={inputWithIcon} />
        </FieldRow>
        <FieldRow icon={<KeyRound size={17} />}>
          <input value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Create password (min 8 chars)" type={show ? 'text' : 'password'} autoComplete="new-password" className={`${inputWithIcon} pr-11!`} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-ink/35 hover:text-ink">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </FieldRow>
        {mode === 'team' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <FieldRow icon={<TicketCheck size={17} />}>
              <input value={form.joinCode} onChange={(e) => set('joinCode', e.target.value.toUpperCase())} placeholder="Team join code (from the owner)" className={inputWithIcon} />
            </FieldRow>
            <p className="mt-1.5 px-1 text-xs font-semibold text-ink/45">
              A valid code instantly activates Staff / Supervisor access. Codes are issued under Users → Team join codes.
            </p>
          </motion.div>
        )}

        {error && <Err>{error}</Err>}

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-[15px] font-extrabold text-night shadow-xl shadow-gold/30 disabled:opacity-60"
        >
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-night/40 border-t-night" /> : <>Request Access <ArrowRight size={18} /></>}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-[13.5px] font-semibold text-ink/55">
        Already registered? <Link to="/login" className="font-extrabold text-golddeep hover:underline">Login here</Link>
      </p>
    </Shell>
  );
}

// ───────── PENDING ─────────
export function Pending() {
  const me = useApp((s) => s.authProfile);
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-paper w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto w-fit"><SuccessCheck /></div>
        <h2 className="font-display mt-5 text-2xl font-bold">Request received!</h2>
        <p className="mt-2 text-sm leading-relaxed font-medium text-ink/55">
          {me ? (
            <>Hi <span className="font-extrabold">{me.name.split(' ')[0]}</span>, your account is <span className="font-extrabold text-golddeep">pending approval</span>. The owner will verify and activate it shortly.</>
          ) : (
            <>Your account is created. <span className="font-extrabold text-golddeep">Confirm your email</span> (if asked), then wait for the owner to activate it — usually within a few hours.</>
          )}
        </p>
        <div className="mt-5 rounded-2xl bg-amberwash/70 p-4 text-left text-[13px] leading-relaxed font-semibold text-bronze">
          What happens next?
          <ul className="mt-2 list-disc space-y-1 pl-5 font-medium">
            <li>Owner links your login to your client / worker record</li>
            <li>You can then login and see your own dashboard</li>
          </ul>
        </div>
        <Link to="/login" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-night py-3 text-sm font-extrabold text-white">
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
}

// ───────── FORGOT ─────────
export function Forgot() {
  const navigate = useNavigate();
  const forgotPassword = useApp((s) => s.forgotPassword);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg('');
      return toast.error('Please enter a valid email address');
    }
    setBusy(true);
    setMsg(await forgotPassword(email));
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-paper w-full max-w-md rounded-3xl p-8">
        <div className="grid h-13 w-13 place-items-center rounded-2xl bg-amberwash p-3 text-golddeep"><KeyRound size={24} /></div>
        <h2 className="font-display mt-4 text-2xl font-bold">Reset password</h2>
        <p className="mt-1 text-sm font-medium text-ink/55">Enter your registered email and we'll send a secure reset link.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <FieldRow icon={<Mail size={17} />}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" className={inputWithIcon} />
          </FieldRow>
          {msg && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-mint/70 px-3.5 py-2.5 text-[13px] leading-relaxed font-bold text-forest">
              {msg}
            </motion.p>
          )}
          <div className="rounded-xl bg-ink/4 px-3.5 py-2.5 text-[12px] leading-relaxed font-semibold text-ink/50">
            <ShieldCheck size={13} className="mr-1 inline text-forest" />
            The link is single-use, expires in 60 minutes, and works only on this device (secure PKCE flow). Nobody — including admins — can change your password without it.
          </div>
          <button disabled={busy} className="w-full cursor-pointer rounded-2xl bg-night py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
          <button type="button" onClick={() => navigate('/login')} className="w-full cursor-pointer rounded-2xl border-[1.5px] border-line py-3 text-sm font-extrabold text-ink/70 hover:border-gold">
            Back to Login
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ───────── RESET (from the emailed link) ─────────
export function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.next.length < 8) return setError('Password must be at least 8 characters.');
    if (pw.next !== pw.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await completePasswordReset(pw.next);
      toast.success('Password updated', 'Log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-paper w-full max-w-md rounded-3xl p-8">
        <div className="grid h-13 w-13 place-items-center rounded-2xl bg-mint p-3 text-forest"><Lock size={24} /></div>
        <h2 className="font-display mt-4 text-2xl font-bold">Set a new password</h2>
        <p className="mt-1 text-sm font-medium text-ink/55">You verified the reset link — choose a strong new password.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <FieldRow icon={<KeyRound size={17} />}>
            <input value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="New password (min 8 chars)" type="password" autoComplete="new-password" className={inputWithIcon} />
          </FieldRow>
          <FieldRow icon={<Lock size={17} />}>
            <input value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Confirm new password" type="password" autoComplete="new-password" className={inputWithIcon} />
          </FieldRow>
          {error && <Err>{error}</Err>}
          <button disabled={busy} className="w-full cursor-pointer rounded-2xl bg-night py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ───────── SETUP GUIDE (first-run: run the SQL) ─────────
export function Setup() {
  const [copied, setCopied] = useState('');
  const copy = async (file: string, label: string) => {
    try {
      const res = await fetch(`/${file}.sql`);
      await navigator.clipboard.writeText(await res.text());
      setCopied(label);
      toast.success(`${label} copied`, 'Paste it into Supabase → SQL Editor → Run.');
    } catch {
      toast.error('Copy failed', `Open /${file}.sql and copy manually.`);
    }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-paper w-full max-w-xl rounded-3xl p-8">
        <div className="grid h-13 w-13 place-items-center rounded-2xl bg-amberwash p-3 text-golddeep"><Building2 size={24} /></div>
        <h2 className="font-display mt-4 text-2xl font-bold">First-time setup</h2>
        <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed font-medium text-ink/65 marker:font-extrabold marker:text-golddeep">
          <li>Open your Supabase project → <span className="font-bold">SQL Editor</span> → New query.</li>
          <li>Copy the schema below (or open <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[12px]">/schema.sql</code>) and run it once. It creates all tables, security policies, the signup trigger, the photo bucket and realtime.</li>
          <li>In <span className="font-bold">Authentication → Providers → Email</span>, you may disable “Confirm email” while testing, and add your own SMTP for production.</li>
          <li><span className="font-bold">The first account to sign up automatically becomes the Owner</span> (admin). Everyone else needs a join code or approval.</li>
        </ol>
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <button onClick={() => void copy('schema', 'Setup SQL')} className="cursor-pointer rounded-2xl bg-night px-4 py-3 text-sm font-extrabold text-white transition hover:bg-ink2">
            {copied === 'Setup SQL' ? '✓ Copied!' : '1 · Copy setup SQL'}
          </button>
          <button onClick={() => void copy('demo-data', 'Demo data SQL')} className="cursor-pointer rounded-2xl border-[1.5px] border-gold bg-amberwash px-4 py-3 text-sm font-extrabold text-bronze transition hover:brightness-105">
            {copied === 'Demo data SQL' ? '✓ Copied!' : '2 · Copy demo-data SQL'}
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-ink/45">Run both once, in order — the second script fills the app with sample workers, attendance and logins so nothing ever looks empty.</p>
        <Link to="/signup" className="mt-2.5 block w-full rounded-2xl border-[1.5px] border-line py-3 text-center text-sm font-extrabold text-ink/70 transition hover:border-gold">
          I'm done — create my owner account
        </Link>
      </motion.div>
    </div>
  );
}
