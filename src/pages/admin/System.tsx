// ─── Admin · Reports, Users, Settings ───
import { motion } from 'framer-motion';
import {
  BadgeCheck, BarChart3, Bell, Building2, Cloud, Copy, FileSpreadsheet, FileText,
  Printer, ShieldCheck, TicketCheck, UserCog, Users, Wallet, XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Fab, PageWrapper } from '../../components/layout';
import {
  Avatar, Badge, Btn, Field, inputCls, Modal, PageHeader,
  ProgressBar, staggerChild, staggerParent,
} from '../../components/ui';
import { useToast } from '../../store/appStore';
import { fmtDate, inr, monthLabel, num } from '../../lib/format';
import { printDetailed, printEstimate, printPLSummary, printSalary, type SalaryRow } from '../../lib/pdf';
import type { Profile, Role } from '../../types';
import {
  currentMonthKey, globalTotals, labourCost, projectStats, sessionProfile,
  toast, useApp, vehicleCost, workerMonthSummary,
} from '../../store/appStore';
import { DataTable, MoneyCell } from './Crud';

// ═══════════════ REPORTS ═══════════════
export function ReportsPage() {
  const s = useApp((st) => st);
  const [month, setMonth] = useState(currentMonthKey());
  const totals = useMemo(() => globalTotals(s), [s]);
  const monthKey = month;

  const monthIncome = s.income.filter((i) => i.date.slice(0, 7) === monthKey);
  const monthMaterials = s.materials.filter((m) => m.date.slice(0, 7) === monthKey);
  const monthExpenses = s.expenses.filter((e) => e.date.slice(0, 7) === monthKey);
  const monthLogs = s.vehicleLogs.filter((l) => l.date.slice(0, 7) === monthKey);
  const monthLabour = labourCost(s, { month: monthKey });
  const monthVehicle = vehicleCost(s, { month: monthKey });
  const mIncomeTotal = monthIncome.reduce((x, i) => x + num(i.amount), 0);
  const mMatTotal = monthMaterials.reduce((x, m) => x + num(m.qty) * num(m.rate), 0);
  const mExpTotal = monthExpenses.reduce((x, e) => x + num(e.amount), 0);
  const mCost = monthLabour + mMatTotal + mExpTotal + monthVehicle;

  const salaryRows: SalaryRow[] = s.workers
    .filter((w) => w.active)
    .map((w) => {
      const ms = workerMonthSummary(s, w.id, monthKey);
      return {
        name: w.name, skill: w.skill, rate: num(w.rate),
        present: ms.present, half: ms.half, absent: ms.absent,
        gross: ms.gross, advance: ms.advance, net: ms.net,
      };
    })
    .filter((r) => r.gross > 0 || r.advance > 0);
  const salaryGrand = salaryRows.reduce((x, r) => x + r.net, 0);

  const clientName = (id: string) => s.clients.find((c) => c.id === id)?.name ?? '—';
  const vehicleName = (id: string) => s.vehicles.find((v) => v.id === id)?.name ?? '—';
  const vehicleRate = (id: string) => num(s.vehicles.find((v) => v.id === id)?.ratePerHour);

  const doPL = () => {
    printPLSummary(
      s.settings, totals,
      s.projects.map((p) => {
        const st = projectStats(s, p.id);
        return { project: p.name, income: st.income, cost: st.cost, profit: st.profit };
      }),
    );
    toast.success('P&L sent to printer', 'Choose "Save as PDF" in the print dialog.');
  };

  const doDetailed = () => {
    printDetailed(s.settings, {
      incomeRows: monthIncome.map((i) => ({ date: i.date, client: clientName(i.clientId), work: i.work ?? 'Payment', amount: num(i.amount), mode: i.mode })),
      materialRows: monthMaterials.map((m) => ({ date: m.date, name: m.name, vendor: m.vendor ?? '—', qty: `${m.qty} ${m.unit}`, amount: num(m.qty) * num(m.rate) })),
      expenseRows: monthExpenses.map((e) => ({ date: e.date, description: e.description, category: e.category, amount: num(e.amount) })),
      vehicleRows: monthLogs.map((l) => ({ date: l.date, vehicle: vehicleName(l.vehicleId), work: l.work ?? '—', cost: num(l.hours) * vehicleRate(l.vehicleId) + num(l.dieselLitres) * num(l.dieselRate) })),
      labourTotal: monthLabour,
      totals: { income: mIncomeTotal, cost: mCost, net: mIncomeTotal - mCost },
    });
    toast.success('Detailed report sent to printer', monthLabel(monthKey));
  };

  const doSalary = () => {
    if (salaryRows.length === 0) return toast.error('No salary data for this month');
    printSalary(s.settings, monthLabel(monthKey), salaryRows);
    toast.success('Salary sheet sent to printer', `${salaryRows.length} workers · ${inr(salaryGrand)}`);
  };

  const reports = [
    {
      icon: <BarChart3 size={24} />, bg: 'bg-mint', fg: 'text-forest',
      title: 'P&L Summary', desc: 'Stat boxes, project-wise profit and net result. The owner\'s one-pager.',
      meta: `Net ${inr(totals.net)} overall`, action: doPL,
    },
    {
      icon: <FileSpreadsheet size={24} />, bg: 'bg-skywash', fg: 'text-steel',
      title: 'Detailed Report', desc: 'Every income, material, expense and vehicle entry for the month.',
      meta: `${monthIncome.length + monthMaterials.length + monthExpenses.length + monthLogs.length} records · ${monthLabel(monthKey)}`, action: doDetailed,
    },
    {
      icon: <Wallet size={24} />, bg: 'bg-amberwash', fg: 'text-golddeep',
      title: 'Salary Sheet', desc: 'Attendance register summary with advances and net payable per worker.',
      meta: `${salaryRows.length} workers · ${inr(salaryGrand)} payable`, action: doSalary,
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Reports" subtitle="One-click PDFs — print or save straight from the browser."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-ink/50">Month</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputCls()} w-[160px]`} />
          </div>
        }
      />

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
        {reports.map((r) => (
          <motion.div key={r.title} variants={staggerChild} whileHover={{ y: -4 }} className="card-paper tap-lift flex flex-col rounded-3xl p-6">
            <div className={`grid h-13 w-13 place-items-center rounded-2xl p-3 ${r.bg} ${r.fg}`}>{r.icon}</div>
            <h3 className="font-display mt-4 text-xl font-bold">{r.title}</h3>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed font-medium text-ink/55">{r.desc}</p>
            <p className="mt-3 text-xs font-extrabold text-golddeep">{r.meta}</p>
            <Btn className="mt-4 w-full" onClick={r.action}><Printer size={16} /> Print / PDF</Btn>
          </motion.div>
        ))}
      </motion.div>

      {/* month preview */}
      <div className="card-paper mt-4 rounded-3xl p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold">{monthLabel(monthKey)} — quick preview</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { l: 'Income', v: mIncomeTotal, c: 'text-forest', bg: 'bg-mint/70' },
            { l: 'Labour', v: monthLabour, c: 'text-steel', bg: 'bg-skywash/70' },
            { l: 'Materials', v: mMatTotal, c: 'text-golddeep', bg: 'bg-amberwash/70' },
            { l: 'Expenses', v: mExpTotal, c: 'text-plum', bg: 'bg-plumwash/70' },
            { l: 'Net', v: mIncomeTotal - mCost, c: mIncomeTotal - mCost >= 0 ? 'text-forest' : 'text-clay', bg: 'bg-night text-white' },
          ].map((x) => (
            <div key={x.l} className={`rounded-2xl px-4 py-3 ${x.bg}`}>
              <div className={`text-[10.5px] font-extrabold tracking-widest uppercase ${x.l === 'Net' ? 'text-gold' : 'opacity-60'}`}>{x.l}</div>
              <div className={`font-display text-lg font-bold ${x.l === 'Net' ? 'text-white' : x.c}`}>{inr(x.v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* estimates print list */}
      <div className="card-paper mt-4 rounded-3xl p-5 sm:p-6">
        <h3 className="font-display mb-3 text-lg font-bold">Estimate PDFs</h3>
        <DataTable
          perPage={5}
          rows={[...s.estimates].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
          columns={[
            { header: 'No', render: (e) => <span className="font-mono text-xs font-extrabold text-golddeep">{e.estimateNo}</span> },
            { header: 'Client', render: (e) => <span className="font-extrabold">{clientName(e.clientId)}</span> },
            { header: 'Title', render: (e) => <span className="text-ink/60">{e.title}</span> },
            { header: 'Total', render: (e) => <MoneyCell value={inr(e.total)} /> },
            { header: 'Status', render: (e) => <Badge>{e.status}</Badge> },
            {
              header: '', className: 'text-right',
              render: (e) => (
                <Btn small variant="dark" onClick={() => {
                  const c = s.clients.find((x) => x.id === e.clientId);
                  if (c) printEstimate(s.settings, e, c, s.projects.find((x) => x.id === e.projectId));
                }}>
                  <Printer size={14} /> PDF
                </Btn>
              ),
            },
          ]}
          empty={<p className="py-4 text-center text-sm font-semibold text-ink/45">No estimates yet.</p>}
        />
      </div>
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ USERS ═══════════════
export function UsersPage() {
  const profiles = useApp((s) => s.profiles);
  const clients = useApp((s) => s.clients);
  const workers = useApp((s) => s.workers);
  const approveSignup = useApp((s) => s.approveSignup);
  const rejectSignup = useApp((s) => s.rejectSignup);
  const setUserRole = useApp((s) => s.setUserRole);
  const setUserActive = useApp((s) => s.setUserActive);
  const me = useApp(sessionProfile);
  const [linkFor, setLinkFor] = useState<Profile | null>(null);
  const [linkId, setLinkId] = useState('');
  const [codes, setCodes] = useState<{ code: string; role: string; max_uses: number; used_count: number }[]>([]);
  const [codesOpen, setCodesOpen] = useState(false);
  const [newCodeRole, setNewCodeRole] = useState<'staff' | 'supervisor'>('staff');

  const pending = profiles.filter((p) => p.status === 'pending');
  const linkedName = (p: { role: Role; linkedId?: string }) => {
    if (!p.linkedId) return '—';
    if (p.role === 'client') return clients.find((c) => c.id === p.linkedId)?.name ?? p.linkedId;
    if (p.role === 'worker') return workers.find((w) => w.id === p.linkedId)?.name ?? p.linkedId;
    return '—';
  };

  const openApprove = (a: Profile) => {
    setLinkFor(a);
    setLinkId(a.role === 'client' ? (clients[0]?.id ?? '') : a.role === 'worker' ? (workers[0]?.id ?? '') : '');
  };

  const confirmApprove = () => {
    if (!linkFor) return;
    if ((linkFor.role === 'client' || linkFor.role === 'worker') && !linkId) {
      return toast.error('Please link this login to a record');
    }
    void approveSignup(linkFor.id, linkId ? { kind: linkFor.role as 'client' | 'worker', id: linkId } : null);
    setLinkFor(null);
  };

  const loadCodes = async () => {
    setCodesOpen(true);
    try {
      const { adminListJoinCodes } = await import('../../services/auth');
      setCodes(await adminListJoinCodes());
    } catch { /* non-fatal */ }
  };
  const makeCode = async () => {
    try {
      const { adminCreateJoinCode } = await import('../../services/auth');
      const code = await adminCreateJoinCode(newCodeRole, 1);
      setCodes((c) => [{ code, role: newCodeRole, max_uses: 1, used_count: 0 }, ...c]);
      toast.success('Join code ready', 'Share it once — it works for exactly one signup.');
    } catch (err: unknown) {
      toast.error('Could not create code', (err as Error)?.message || '');
    }
  };

  return (
    <PageWrapper>
      <PageHeader title="Users" subtitle="Approvals, roles and access control." />

      {/* pending approvals */}
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg font-bold">
        <Bell size={18} className="text-golddeep" /> Pending approvals
        <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-night">{pending.length}</span>
      </h3>
      {pending.length === 0 ? (
        <div className="card-paper mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-bold text-ink/55">
          <BadgeCheck size={18} className="text-forest" /> All caught up — no signup requests waiting.
        </div>
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="mb-6 grid gap-3 md:grid-cols-2">
          {pending.map((a) => (
            <motion.div key={a.id} variants={staggerChild} className="card-paper rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-extrabold">{a.name}</div>
                  <div className="truncate text-xs font-semibold text-ink/50">{a.email} · {a.phone}</div>
                </div>
                <Badge>{a.role}</Badge>
              </div>
              <div className="mt-3 text-xs font-semibold text-ink/45">Requested {fmtDate(a.createdAt)}</div>
              <div className="mt-3 flex gap-2">
                <Btn small variant="success" className="flex-1" onClick={() => openApprove(a)}><BadgeCheck size={15} /> Approve</Btn>
                <Btn small variant="outline" className="flex-1 text-clay!" onClick={() => { void rejectSignup(a.id); }}>
                  <XCircle size={15} /> Reject
                </Btn>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* all users */}
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg font-bold">
        <Users size={18} className="text-golddeep" /> All users <span className="text-sm font-bold text-ink/40">({profiles.length})</span>
      </h3>
      <DataTable
        rows={[...profiles].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
        columns={[
          {
            header: 'User',
            render: (p) => (
              <span className="flex items-center gap-2.5">
                <Avatar name={p.name} size="sm" />
                <span>
                  <span className="block font-extrabold">{p.name} {p.id === me?.id && <span className="text-[10px] text-golddeep">(you)</span>}</span>
                  <span className="block text-[11.5px] font-semibold text-ink/45">{p.email}</span>
                </span>
              </span>
            ),
          },
          {
            header: 'Role',
            render: (p) => (
              <select
                value={p.role}
                disabled={p.id === me?.id}
                onChange={(e) => { setUserRole(p.id, e.target.value as Role); toast.success('Role updated', `${p.name} → ${e.target.value}`); }}
                className="field cursor-pointer py-1.5! text-[12.5px] font-extrabold disabled:opacity-50"
              >
                {(['admin', 'staff', 'client', 'worker', 'supervisor'] as Role[]).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ),
          },
          { header: 'Linked record', render: (p) => <span className="text-ink/60">{linkedName(p)}</span> },
          { header: 'Since', render: (p) => fmtDate(p.createdAt) },
          {
            header: 'Active',
            render: (p) => (
              <button
                disabled={p.id === me?.id}
                onClick={() => { setUserActive(p.id, !p.active); toast.info(p.active ? 'User deactivated' : 'User activated', p.name); }}
                className={`relative h-6.5 w-11.5 cursor-pointer rounded-full p-0.5 transition disabled:opacity-40 ${p.active ? 'bg-forest' : 'bg-ink/20'}`}
                style={{ height: 26, width: 46 }}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className={`block h-[22px] w-[22px] rounded-full bg-white shadow ${p.active ? 'ml-auto' : ''}`}
                />
              </button>
            ),
          },
        ]}
        empty={<p />}
      />

      <Modal open={!!linkFor} onClose={() => setLinkFor(null)} title="Approve account" subtitle={`Link ${linkFor?.name} to their record so they see the right data.`}>
        {(linkFor?.role === 'client' || linkFor?.role === 'worker') ? (
          <Field label={linkFor.role === 'client' ? 'Link to client' : 'Link to worker'}>
            <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className={inputCls()}>
              {(linkFor.role === 'client' ? clients : workers).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
        ) : (
          <p className="rounded-xl bg-cream/70 p-3.5 text-[13px] font-semibold text-ink/60">
            Supervisor accounts don't need linking — they see site-level tools only.
          </p>
        )}
        <div className="mt-4 flex gap-2.5">
          <Btn variant="outline" className="flex-1" onClick={() => setLinkFor(null)}>Cancel</Btn>
          <Btn variant="success" className="flex-1" onClick={confirmApprove}>Approve Access</Btn>
        </div>
      </Modal>

      {/* team join codes */}
      <div className="card-paper mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display flex items-center gap-2 text-lg font-bold"><TicketCheck size={18} className="text-golddeep" /> Team join codes</h3>
          <Btn small onClick={() => void loadCodes()}>{codesOpen ? 'Refresh' : 'Manage codes'}</Btn>
        </div>
        <p className="mt-1 text-[13px] font-medium text-ink/55">Staff and supervisors sign up with a code and get in instantly — no password sharing, no manual approval.</p>
        {codesOpen && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select value={newCodeRole} onChange={(e) => setNewCodeRole(e.target.value as 'staff' | 'supervisor')} className="field w-auto py-1.5! text-[12.5px] font-extrabold">
                <option value="staff">Staff (sub-admin)</option>
                <option value="supervisor">Supervisor (site only)</option>
              </select>
              <Btn small variant="gold" onClick={() => void makeCode()}>Generate one-time code</Btn>
            </div>
            {codes.length === 0 ? (
              <p className="text-[13px] font-semibold text-ink/45">No codes yet — generate one and share it with your new team member.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {codes.map((c) => (
                  <div key={c.code} className="flex items-center justify-between rounded-xl bg-ink/4 px-3.5 py-2.5">
                    <div>
                      <div className="font-mono text-sm font-extrabold tracking-wider">{c.code}</div>
                      <div className="text-[11px] font-bold text-ink/45">{c.role} · used {c.used_count}/{c.max_uses}</div>
                    </div>
                    <button onClick={() => { void navigator.clipboard.writeText(c.code); toast.info('Copied'); }} className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-white ring-1 ring-line hover:border-gold" aria-label="Copy code"><Copy size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ SETTINGS ═══════════════
export function SettingsPage() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const me = useApp(sessionProfile);
  const saveMyProfile = useApp((s) => s.saveMyProfile);
  const changePasswordCloud = useApp((s) => s.changePassword);
  const resetDemo = useApp((s) => s.resetDemo);
  const publishSampleData = useApp((s) => s.publishSampleData);
  const refreshFromCloud = useApp((s) => s.refreshFromCloud);
  const cloudLoading = useApp((s) => s.cloudLoading);
  const lastSyncedAt = useApp((s) => s.lastSyncedAt);
  const push = useToast((t) => t.push);
  const [tab, setTab] = useState<'profile' | 'business' | 'notifications'>('profile');
  const [biz, setBiz] = useState({ ...settings });
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const saveProfile = () => {
    if (!me) return;
    if (name.trim().length < 3) return toast.error('Name is too short');
    void saveMyProfile({ name: name.trim(), phone }).catch((err: unknown) =>
      toast.error('Profile update failed', (err as Error)?.message || ''),
    );
  };

  const saveBusiness = () => {
    if (biz.businessName.trim().length < 3) return toast.error('Business name is too short');
    updateSettings({ ...biz });
    toast.success('Business details saved', 'PDF headers will use the new details.');
  };

  const [pwBusy, setPwBusy] = useState(false);
  const changePassword = async () => {
    if (!me) return;
    if (pw.next.length < 8) return toast.error('New password must be at least 8 characters');
    if (pw.next !== pw.confirm) return toast.error('New passwords do not match');
    setPwBusy(true);
    try {
      await changePasswordCloud(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      toast.error('Password change failed', (err as Error)?.message || '');
    } finally {
      setPwBusy(false);
    }
  };

  const Toggle = ({ on, onClick, label, desc }: { on: boolean; onClick: () => void; label: string; desc: string }) => (
    <button onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white/50 p-4 text-left transition hover:border-gold/60">
      <span className="flex-1">
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="block text-xs font-semibold text-ink/50">{desc}</span>
      </span>
      <span className={`relative rounded-full p-0.5 transition ${on ? 'bg-forest' : 'bg-ink/20'}`} style={{ height: 26, width: 46 }}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`block h-[22px] w-[22px] rounded-full bg-white shadow ${on ? 'ml-auto' : ''}`} />
      </span>
    </button>
  );

  return (
    <PageWrapper>
      <PageHeader title="Settings" subtitle="Profile, business letterhead and notifications." />

      <div className="mb-5 flex gap-2">
        {([
          { id: 'profile', label: 'Profile', icon: <UserCog size={16} /> },
          { id: 'business', label: 'Business', icon: <Building2 size={16} /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold transition ${tab === t.id ? 'text-white' : 'bg-ink/5 text-ink/55 hover:bg-ink/10'}`}
          >
            {tab === t.id && <motion.span layoutId="set-tab" className="absolute inset-0 rounded-2xl bg-night" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
            <span className="relative flex items-center gap-2">{t.icon} {t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card-paper rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={me?.name ?? 'Admin'} size="lg" />
              <div>
                <h3 className="font-display text-lg font-bold">{me?.name}</h3>
                <p className="text-xs font-bold text-ink/50">{me?.email} · <Badge>{me?.role}</Badge></p>
              </div>
            </div>
            <div className="grid gap-3.5">
              <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls()} /></Field>
              <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls()} /></Field>
              <Btn onClick={saveProfile}>Save Profile</Btn>
            </div>
          </div>
          <div className="card-paper rounded-3xl p-6">
            <h3 className="font-display mb-1 flex items-center gap-2 text-lg font-bold"><ShieldCheck size={19} className="text-golddeep" /> Change password</h3>
            <p className="mb-4 text-[13px] font-medium text-ink/55">Your current password is verified by the server — nobody can change it without it.</p>
            <div className="grid gap-3.5">
              <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputCls()} /></Field>
              <Field label="New password"><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputCls()} /></Field>
              <Field label="Confirm new password"><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputCls()} /></Field>
              <Btn variant="dark" disabled={pwBusy} onClick={() => void changePassword()}>{pwBusy ? 'Verifying…' : 'Update Password'}</Btn>
            </div>
          </div>
          <div className="card-paper rounded-3xl p-6 lg:col-span-2">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold"><Cloud size={19} className="text-golddeep" /> Cloud &amp; sample data</h3>
            <p className="mt-1 text-[13px] font-medium text-ink/55">This workspace syncs live with Supabase — every device sees the same data within a second.</p>
            {lastSyncedAt && (
              <p className="mt-1.5 text-xs font-bold text-forest">☁️ Last synced {new Date(lastSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · realtime is on</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Btn variant="dark" disabled={cloudLoading} onClick={() => void refreshFromCloud()}>{cloudLoading ? 'Refreshing…' : 'Refresh from cloud'}</Btn>
              <Btn variant="outline" disabled={cloudLoading} onClick={() => void publishSampleData()}>{cloudLoading ? 'Working…' : 'Publish sample data to Supabase'}</Btn>
              <Btn variant="danger" onClick={() => { resetDemo(); push('info', 'Sample data restored locally', 'This does not touch the cloud until you publish it.'); }}>Reset local sample data</Btn>
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/45">“Publish” sends the sample projects/workers once, only if your database is still empty — a quick way to try the system before real data comes in.</p>
          </div>
        </div>
      )}

      {tab === 'business' && (
        <div className="card-paper rounded-3xl p-6">
          <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold"><FileText size={19} className="text-golddeep" /> Letterhead — appears on every PDF</h3>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Business name"><input value={biz.businessName} onChange={(e) => setBiz({ ...biz, businessName: e.target.value })} className={inputCls()} /></Field>
            <Field label="Owner name"><input value={biz.ownerName} onChange={(e) => setBiz({ ...biz, ownerName: e.target.value })} className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><input value={biz.address} onChange={(e) => setBiz({ ...biz, address: e.target.value })} className={inputCls()} /></Field></div>
            <Field label="Phone"><input value={biz.phone} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} className={inputCls()} /></Field>
            <Field label="Email"><input value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} className={inputCls()} /></Field>
            <Field label="GST number"><input value={biz.gst} onChange={(e) => setBiz({ ...biz, gst: e.target.value })} className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Estimate terms & conditions"><textarea value={biz.terms} onChange={(e) => setBiz({ ...biz, terms: e.target.value })} rows={4} className={`${inputCls()} resize-none`} /></Field></div>
          </div>
          {/* live letterhead preview */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="border-b-[3px] border-gold p-4">
              <div className="font-display text-xl font-bold">Sarvotam <span className="text-golddeep">Construction</span></div>
              <div className="mt-1 text-xs font-medium text-ink/55">{biz.address}<br />Phone: {biz.phone} · {biz.email}{biz.gst ? ` · GSTIN: ${biz.gst}` : ''}</div>
            </div>
            <div className="p-4">
              <div className="text-[11px] font-extrabold tracking-widest text-ink/40 uppercase">Budget health preview</div>
              <div className="mt-2"><ProgressBar value={62} color="#0B6B4F" /></div>
            </div>
          </div>
          <Btn className="mt-4" onClick={saveBusiness}>Save Business Details</Btn>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card-paper grid gap-3 rounded-3xl p-6">
          <h3 className="font-display text-lg font-bold">Automatic alerts</h3>
          <Toggle on={settings.notifySignup} onClick={() => updateSettings({ notifySignup: !settings.notifySignup })} label="New signup requests" desc="Notify when someone requests an account." />
          <Toggle on={settings.notifyAttendance} onClick={() => updateSettings({ notifyAttendance: !settings.notifyAttendance })} label="Attendance reminders" desc="Alert if attendance is not marked for the day." />
          <Toggle on={settings.notifyStock} onClick={() => updateSettings({ notifyStock: !settings.notifyStock })} label="Low stock warnings" desc="Alert when material stock runs below 20%." />
          <Toggle on={settings.notifyBudget} onClick={() => updateSettings({ notifyBudget: !settings.notifyBudget })} label="Budget overruns" desc="Alert when a project crosses 80% of budget." />
        </div>
      )}
      <Fab />
    </PageWrapper>
  );
}
