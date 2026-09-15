// ─── App shells · sidebar, headers, portals, FAB ───
import { AnimatePresence, motion } from 'framer-motion';
import {
  Banknote, BarChart3, Briefcase, Building2, CalendarCheck, Camera, FileText,
  HardHat, Home, LayoutDashboard, LogOut, Menu, Package, Plus,
  Receipt, Settings, Truck, User, Users, Wallet, X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { fmtDateLong, timeAgo, todayISO } from '../lib/format';
import { isSupabaseEnabled } from '../lib/supabase';
import { sessionProfile, toast, useApp } from '../store/appStore';
import { Avatar, BellDot, Logo, pageVariants } from './ui';

// ───────── page wrapper ─────────
export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

// ───────── nav config ─────────
interface NavItem { to: string; label: string; icon: ReactNode; badge?: number; adminOnly?: boolean }

function adminNav(counts: { approvals: number; unpaid: number }, isAdmin: boolean): NavItem[] {
  return [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { to: '/admin/projects', label: 'Projects', icon: <Building2 size={19} /> },
    { to: '/admin/clients', label: 'Clients', icon: <Briefcase size={19} /> },
    { to: '/admin/workers', label: 'Workers', icon: <HardHat size={19} /> },
    { to: '/admin/attendance', label: 'Attendance', icon: <CalendarCheck size={19} /> },
    { to: '/admin/materials', label: 'Materials', icon: <Package size={19} />, badge: counts.unpaid },
    { to: '/admin/income', label: 'Income', icon: <Banknote size={19} /> },
    { to: '/admin/expenses', label: 'Expenses', icon: <Receipt size={19} /> },
    { to: '/admin/vehicles', label: 'Vehicles', icon: <Truck size={19} /> },
    { to: '/admin/estimates', label: 'Estimates', icon: <FileText size={19} /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={19} /> },
    { to: '/admin/photos', label: 'Site Photos', icon: <Camera size={19} /> },
    { to: '/admin/users', label: 'Users', icon: <Users size={19} />, badge: counts.approvals, adminOnly: true },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={19} />, adminOnly: true },
  ].filter((n) => isAdmin || !n.adminOnly);
}

// ───────── sidebar ─────────
function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const approvals = useApp((s) => s.profiles.filter((p) => p.status === 'pending').length);
  const unpaid = useApp((s) => s.materials.filter((m) => !m.paid).length);
  const isOwner = useApp((s) => s.authProfile?.role === 'admin');
  const cloudLoading = useApp((s) => s.cloudLoading);
  const lastSyncedAt = useApp((s) => s.lastSyncedAt);
  const nav = useMemo(() => adminNav({ approvals, unpaid }, isOwner), [approvals, unpaid, isOwner]);

  return (
    <div className="flex h-full flex-col bg-night text-white">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Logo dark />
      </div>
      <div className="mx-5 mb-3 rounded-xl bg-gradient-to-r from-gold/20 to-gold/5 px-3.5 py-2.5 ring-1 ring-gold/25 ring-inset">
        <div className="text-[11px] font-bold tracking-wider text-gold uppercase">Today</div>
        <div className="text-[13px] font-bold text-white/90">{fmtDateLong(todayISO())}</div>
      </div>
      <nav className="dark-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all ${
                isActive ? 'bg-gold/15 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-glow"
                    className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={isActive ? 'text-gold' : 'text-white/45 group-hover:text-white/80'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {!!item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1.5 text-[10.5px] font-extrabold text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${isSupabaseEnabled ? 'bg-emerald-400' : 'bg-gold'} animate-pulse-dot`} />
          <span className="text-xs font-bold text-white/70">
            {cloudLoading ? 'Syncing…' : isSupabaseEnabled
              ? lastSyncedAt ? 'Realtime Sync · Live' : 'Supabase Connected'
              : 'Offline · Cached Data'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────── notifications dropdown ─────────
function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const notifications = useApp((s) => s.notifications);
  const markNotification = useApp((s) => s.markNotification);
  const markAllRead = useApp((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;

  const dot: Record<string, string> = {
    info: 'bg-steel', success: 'bg-forest', warning: 'bg-gold', error: 'bg-clay',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-xl border-[1.5px] border-line bg-white/70 text-ink/70 transition hover:border-gold hover:text-ink"
        aria-label="Notifications"
      >
        <BellDot count={unread} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="card-paper absolute right-0 z-50 mt-2 w-[min(88vw,340px)] overflow-hidden rounded-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-extrabold">Notifications</span>
                <button onClick={markAllRead} className="cursor-pointer text-xs font-bold text-golddeep hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm font-medium text-ink/45">No notifications yet.</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { markNotification(n.id); }}
                    className={`flex w-full cursor-pointer items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition last:border-0 hover:bg-amberwash/50 ${n.read ? 'opacity-60' : ''}`}
                  >
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot[n.type]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{n.title}</span>
                      <span className="block text-[12.5px] leading-snug font-medium text-ink/55">{n.message}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-ink/35">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────── user menu ─────────
function UserMenu({ home }: { home: string }) {
  const [open, setOpen] = useState(false);
  const me = useApp(sessionProfile);
  const logout = useApp((s) => s.logout);
  const navigate = useNavigate();
  if (!me) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-white/70 py-1.5 pr-3 pl-1.5 transition hover:border-gold"
      >
        <Avatar name={me.name} size="sm" />
        <span className="hidden max-w-[110px] truncate text-left text-[13px] leading-tight font-bold sm:block">
          {me.name.split(' ')[0]}
          <span className="block text-[10.5px] font-bold tracking-wide text-golddeep uppercase">{me.role}</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="card-paper absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl p-1.5"
            >
              <div className="px-3 py-2.5">
                <div className="truncate text-sm font-extrabold">{me.name}</div>
                <div className="truncate text-xs font-medium text-ink/50">{me.email}</div>
              </div>
              <button
                onClick={() => { setOpen(false); navigate(home); }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-ink/70 hover:bg-amberwash/70"
              >
                <User size={16} /> My Profile
              </button>
              <button
                onClick={() => { logout(); toast.info('Logged out', 'See you soon!'); navigate('/login'); }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-clay hover:bg-blush/70"
              >
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────── global search ─────────
function GlobalSearch() {
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);
  const workers = useApp((s) => s.workers);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return [
      ...projects.filter((p) => p.name.toLowerCase().includes(needle)).map((p) => ({ label: p.name, sub: 'Project', to: '/admin/projects' })),
      ...clients.filter((c) => c.name.toLowerCase().includes(needle)).map((c) => ({ label: c.name, sub: 'Client', to: '/admin/clients' })),
      ...workers.filter((w) => w.name.toLowerCase().includes(needle)).map((w) => ({ label: w.name, sub: 'Worker', to: '/admin/workers' })),
    ].slice(0, 7);
  }, [q, projects, clients, workers]);

  return (
    <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder="Search projects, clients, workers…"
        className="field rounded-xl! py-2.5! pr-4 pl-10"
      />
      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/35">⌕</span>
      <AnimatePresence>
        {focus && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="card-paper absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl p-1.5"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onMouseDown={() => { navigate(r.to); setQ(''); }}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-amberwash/60"
              >
                <span className="truncate text-[13px] font-bold">{r.label}</span>
                <span className="rounded-full bg-linen px-2 py-0.5 text-[10.5px] font-extrabold text-ink/55">{r.sub}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────── admin layout ─────────
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-paper">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        <Sidebar />
      </aside>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-night/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border-[1.5px] border-line bg-white/70 text-ink/70 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden"><Logo compact /></div>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-2.5">
              <NotificationsMenu />
              <UserMenu home="/admin/settings" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ───────── portal layout (client / worker / supervisor) ─────────
export interface TabItem { to: string; label: string; icon: ReactNode }

export function PortalLayout({ tabs, accent = 'bg-gold' }: { tabs: TabItem[]; accent?: string }) {
  const location = useLocation();
  const me = useApp(sessionProfile);
  const home = tabs[0]?.to ?? '/';

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link to={home}><Logo /></Link>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-xl bg-mint px-3 py-2 text-xs font-extrabold text-forest sm:flex">
              <span className="h-2 w-2 rounded-full bg-forest animate-pulse-dot" />
              {me?.role.toUpperCase()} PORTAL
            </div>
            <NotificationsMenu />
            <UserMenu home={tabs[tabs.length - 1]?.to ?? home} />
          </div>
        </div>
        {/* desktop tabs */}
        <div className="mx-auto hidden w-full max-w-[1100px] items-center gap-1 px-4 pb-2.5 sm:px-6 md:flex">
          {tabs.map((t) => {
            const active = location.pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] font-bold transition ${
                  active ? 'text-ink' : 'text-ink/45 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {t.icon}
                {t.label}
                {active && (
                  <motion.span
                    layoutId="portal-tab"
                    className={`absolute inset-x-3 -bottom-[1px] h-[3px] rounded-full ${accent}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 pt-6 pb-28 sm:px-6 md:pb-12">
        <Outlet />
      </main>

      {/* mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#fffdf7]/95 backdrop-blur-md md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => {
            const active = location.pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-extrabold ${
                  active ? 'text-golddeep' : 'text-ink/40'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab"
                    className="absolute top-0 h-[3px] w-10 rounded-b-full bg-gold"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                {t.icon}
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const clientTabs: TabItem[] = [
  { to: '/client/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/client/estimates', label: 'Estimates', icon: <FileText size={20} /> },
  { to: '/client/projects', label: 'Projects', icon: <Building2 size={20} /> },
  { to: '/client/payments', label: 'Payments', icon: <Wallet size={20} /> },
  { to: '/client/photos', label: 'Updates', icon: <Camera size={20} /> },
  { to: '/client/profile', label: 'Profile', icon: <User size={20} /> },
];

export const workerTabs: TabItem[] = [
  { to: '/worker/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/worker/attendance', label: 'Attendance', icon: <CalendarCheck size={20} /> },
  { to: '/worker/earnings', label: 'Earnings', icon: <Wallet size={20} /> },
  { to: '/worker/profile', label: 'Profile', icon: <User size={20} /> },
];

export const supervisorTabs: TabItem[] = [
  { to: '/supervisor/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/supervisor/attendance', label: 'Attendance', icon: <CalendarCheck size={20} /> },
  { to: '/supervisor/materials', label: 'Materials', icon: <Package size={20} /> },
  { to: '/supervisor/photos', label: 'Photos', icon: <Camera size={20} /> },
];

// ───────── floating action button ─────────
const fabActions = [
  { label: 'Income', icon: <Banknote size={18} />, to: '/admin/income?new=1', bg: 'bg-forest' },
  { label: 'Expense', icon: <Receipt size={18} />, to: '/admin/expenses?new=1', bg: 'bg-clay' },
  { label: 'Attendance', icon: <CalendarCheck size={18} />, to: '/admin/attendance', bg: 'bg-steel' },
  { label: 'Material', icon: <Package size={18} />, to: '/admin/materials?new=1', bg: 'bg-golddeep' },
];

export function Fab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="fixed right-5 bottom-24 z-40 flex flex-col items-end gap-2.5 lg:right-8 lg:bottom-8">
      <AnimatePresence>
        {open && fabActions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 14, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: (fabActions.length - i) * 0.05, type: 'spring', stiffness: 400, damping: 26 } }}
            exit={{ opacity: 0, y: 10, scale: 0.85, transition: { duration: 0.15 } }}
            onClick={() => { setOpen(false); navigate(a.to); }}
            className={`flex cursor-pointer items-center gap-2 rounded-full py-2.5 pr-4 pl-3 text-[13px] font-extrabold text-white shadow-xl ${a.bg}`}
          >
            {a.icon}{a.label}
          </motion.button>
        ))}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        className="grid h-14 w-14 cursor-pointer place-items-center rounded-2xl bg-night text-gold shadow-2xl shadow-black/30"
        aria-label="Quick actions"
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X size={24} /> : <Plus size={24} />}
        </motion.span>
      </motion.button>
    </div>
  );
}
