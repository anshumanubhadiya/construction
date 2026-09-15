// ─── Admin dashboard · P&L command centre ───
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BadgeCheck, Banknote, BellRing,
  Building2, CalendarCheck, CheckCircle2, FileDown, HardHat, Package,
  Receipt, Truck, Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CostDonut, MonthlyBars, ProfitLine } from '../../components/charts';
import { Fab, PageWrapper } from '../../components/layout';
import { AnimatedCounter, Badge, PageHeader, ProgressBar, staggerChild, staggerParent } from '../../components/ui';
import { fmtDate, fmtDateLong, inr, inrShort, todayISO } from '../../lib/format';
import { printPLSummary } from '../../lib/pdf';
import { SetupBanner } from '../public/Auth';
import {
  currentMonthKey, globalTotals, labourCost, monthlySeries, projectStats, sessionProfile,
  toast, useApp, vehicleCost,
} from '../../store/appStore';

export default function Dashboard() {
  const s = useApp((st) => st);
  const me = useApp(sessionProfile);
  const navigate = useNavigate();

  const totals = useMemo(() => globalTotals(s), [s]);
  const series = useMemo(() => monthlySeries(s, 6), [s]);
  const month = currentMonthKey();
  const monthIncome = useMemo(
    () => s.income.filter((i) => i.date.slice(0, 7) === month).reduce((x, i) => x + Number(i.amount || 0), 0),
    [s, month],
  );
  const monthLabour = useMemo(() => labourCost(s, { month }), [s, month]);
  const monthVehicle = useMemo(() => vehicleCost(s, { month }), [s, month]);

  const costSplit = [
    { name: 'Labour', value: totals.labour, color: '#2563eb' },
    { name: 'Materials', value: totals.material, color: '#E8A20C' },
    { name: 'Other expenses', value: totals.expense, color: '#7c3aed' },
    { name: 'Vehicles', value: totals.vehicle, color: '#0d9488' },
  ];

  const projectsWithStats = useMemo(
    () => s.projects.map((p) => ({ p, st: projectStats(s, p.id) })).sort((a, b) => b.st.cost - a.st.cost),
    [s],
  );

  const alerts = useMemo(() => {
    const list: { kind: 'error' | 'warning' | 'success' | 'info'; title: string; desc: string; to?: string }[] = [];
    const unpaid = s.materials.filter((m) => !m.paid);
    const unpaidTotal = unpaid.reduce((x, m) => x + Number(m.qty || 0) * Number(m.rate || 0), 0);
    if (unpaidTotal > 10000) {
      list.push({ kind: 'error', title: `Unpaid material bills of ${inr(unpaidTotal)}`, desc: `${unpaid.length} vendor bills pending — clear before stock runs out.`, to: '/admin/materials' });
    }
    projectsWithStats.forEach(({ p, st }) => {
      if (p.status !== 'Completed' && st.pctUsed >= 80) {
        list.push({ kind: 'warning', title: `"${p.name}" used ${st.pctUsed}% of budget`, desc: `Spent ${inr(st.cost)} of ${inr(p.budget)} — review before approving more.`, to: '/admin/projects' });
      }
    });
    const todayCount = s.attendance.filter((a) => a.date === todayISO()).length;
    if (todayCount === 0 && new Date().getDay() !== 0) {
      list.push({ kind: 'warning', title: "Today's attendance not marked", desc: 'No worker records for today yet — mark it now.', to: '/admin/attendance' });
    }
    const pending = s.profiles.filter((pr) => pr.status === 'pending').length;
    if (pending > 0) {
      list.push({ kind: 'info', title: `${pending} signup approval${pending > 1 ? 's' : ''} pending`, desc: 'New users are waiting for access.', to: '/admin/users' });
    }
    const done = s.projects.filter((p) => p.status === 'Completed').length;
    if (done > 0) {
      list.push({ kind: 'success', title: `${done} project${done > 1 ? 's' : ''} completed`, desc: 'Great work — download the final P&L for records.', to: '/admin/reports' });
    }
    return list.slice(0, 5);
  }, [s, projectsWithStats]);

  const activity = useMemo(() => {
    const items: { icon: React.ReactNode; bg: string; title: string; sub: string; amount: string; positive?: boolean; at: string }[] = [
      ...s.income.map((i) => ({
        icon: <Banknote size={17} />, bg: 'bg-mint text-forest',
        title: `Received from ${s.clients.find((c) => c.id === i.clientId)?.name ?? 'client'}`,
        sub: `${i.work ?? 'Payment'} · ${fmtDate(i.date)}`, amount: `+${inr(i.amount)}`, positive: true, at: i.createdAt,
      })),
      ...s.expenses.map((e) => ({
        icon: <Receipt size={17} />, bg: 'bg-plumwash text-plum',
        title: e.description, sub: `${e.category} · ${fmtDate(e.date)}`, amount: `−${inr(e.amount)}`, at: e.createdAt,
      })),
      ...s.materials.map((m) => ({
        icon: <Package size={17} />, bg: 'bg-amberwash text-golddeep',
        title: `${m.name} (${m.qty} ${m.unit})`, sub: `${m.vendor ?? 'Vendor'} · ${fmtDate(m.date)}`, amount: inr(Number(m.qty) * Number(m.rate)), at: m.createdAt,
      })),
    ];
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);
  }, [s]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Income', value: totals.income, icon: <Banknote size={21} />, bg: 'bg-mint', fg: 'text-forest', bar: '#0B6B4F', sub: `${inrShort(monthIncome)} this month` },
    { label: 'Labour Cost', value: totals.labour, icon: <HardHat size={21} />, bg: 'bg-skywash', fg: 'text-steel', bar: '#2563eb', sub: `${inrShort(monthLabour)} this month` },
    { label: 'Material Cost', value: totals.material, icon: <Package size={21} />, bg: 'bg-amberwash', fg: 'text-golddeep', bar: '#E8A20C', sub: `${s.materials.filter((m) => !m.paid).length} bills unpaid` },
    { label: 'Other Expenses', value: totals.expense, icon: <Receipt size={21} />, bg: 'bg-plumwash', fg: 'text-plum', bar: '#7c3aed', sub: `${s.expenses.length} entries total` },
    { label: 'Vehicle Cost', value: totals.vehicle, icon: <Truck size={21} />, bg: 'bg-tealwash', fg: 'text-tealpop', bar: '#0d9488', sub: `${inrShort(monthVehicle)} this month` },
    { label: 'Net Profit', value: totals.net, icon: <Wallet size={21} />, bg: totals.net >= 0 ? 'bg-mint' : 'bg-blush', fg: totals.net >= 0 ? 'text-forest' : 'text-clay', bar: totals.net >= 0 ? '#0B6B4F' : '#C2491D', sub: totals.net >= 0 ? 'Business is in profit' : 'Costs exceed income' },
  ];

  const exportPL = () => {
    printPLSummary(
      s.settings, totals,
      projectsWithStats.map(({ p, st }) => ({ project: p.name, income: st.income, cost: st.cost, profit: st.profit })),
    );
    toast.success('P&L sent to printer', 'Choose "Save as PDF" in the print dialog.');
  };

  return (
    <PageWrapper>
      <SetupBanner compact />
      <PageHeader
        title={`${greeting}, ${me?.name.split(' ')[0] ?? 'Owner'}!`}
        subtitle={`${fmtDateLong(todayISO())} · Here's your business at a glance.`}
        actions={
          <>
            <button
              onClick={exportPL}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-night px-4 py-2.5 text-[13px] font-extrabold text-white shadow-lg shadow-black/20 transition hover:bg-ink2"
            >
              <FileDown size={15} className="text-gold" /> P&L PDF
            </button>
          </>
        }
      />

      {/* stat cards */}
      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((c) => (
          <motion.div
            key={c.label}
            variants={staggerChild}
            whileHover={{ y: -5 }}
            className="card-paper tap-lift relative overflow-hidden rounded-3xl p-4"
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: c.bar }} />
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.fg}`}>{c.icon}</div>
            <div className="mt-3 text-[11.5px] font-extrabold tracking-wide text-ink/50 uppercase">{c.label}</div>
            <div className="font-display mt-0.5 text-[21px] leading-none font-bold"><AnimatedCounter value={c.value} /></div>
            <div className="mt-1.5 truncate text-[11.5px] font-bold text-ink/45">{c.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* charts row */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-paper rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">Income vs Cost</h3>
              <p className="text-xs font-semibold text-ink/45">Last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] font-extrabold">
              <span className="flex items-center gap-1.5 text-ink/60"><span className="h-2.5 w-2.5 rounded-full bg-forest" /> Income</span>
              <span className="flex items-center gap-1.5 text-ink/60"><span className="h-2.5 w-2.5 rounded-full bg-clay" /> Cost</span>
            </div>
          </div>
          <MonthlyBars data={series} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card-paper rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-lg font-bold">Where money goes</h3>
          <p className="mb-3 text-xs font-semibold text-ink/45">Cost split across categories</p>
          <CostDonut data={costSplit} />
        </motion.div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        {/* alerts */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-night grain relative overflow-hidden rounded-3xl p-5 sm:p-6">
          <div className="relative mb-4 flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold"><BellRing size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">Needs attention</h3>
              <p className="text-xs font-semibold text-white/45">{alerts.length} active alerts</p>
            </div>
          </div>
          <div className="relative space-y-2.5">
            {alerts.map((a, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                onClick={() => a.to && navigate(a.to)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-white/6 p-3.5 text-left ring-1 ring-white/10 ring-inset transition hover:bg-white/10"
              >
                <span className={`mt-0.5 shrink-0 ${a.kind === 'error' ? 'text-red-400' : a.kind === 'warning' ? 'text-gold' : a.kind === 'success' ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {a.kind === 'success' ? <CheckCircle2 size={19} /> : a.kind === 'info' ? <BadgeCheck size={19} /> : <AlertTriangle size={19} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-snug font-extrabold text-white">{a.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug font-medium text-white/50">{a.desc}</span>
                </span>
                {a.to && <ArrowUpRight size={16} className="mt-1 shrink-0 text-white/30" />}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* profit trend + projects */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="card-paper rounded-3xl p-5 sm:p-6">
            <h3 className="font-display text-lg font-bold">Profit trend</h3>
            <p className="mb-3 text-xs font-semibold text-ink/45">Net profit month by month</p>
            <ProfitLine data={series.map((d) => ({ label: d.label, profit: d.profit }))} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-paper rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Project budgets</h3>
                <p className="text-xs font-semibold text-ink/45">Spent vs allocated</p>
              </div>
              <Link to="/admin/projects" className="flex items-center gap-1 text-[12.5px] font-extrabold text-golddeep hover:underline">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {projectsWithStats.map(({ p, st }) => (
                <div key={p.id}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                      <Building2 size={15} className="text-ink/35" /> {p.name}
                      <Badge>{p.status}</Badge>
                    </span>
                    <span className="text-xs font-bold text-ink/50">{inr(st.cost)} / {inr(p.budget)} · {st.pctUsed}%</span>
                  </div>
                  <ProgressBar value={st.pctUsed} color={st.pctUsed >= 90 ? '#C2491D' : st.pctUsed >= 70 ? '#E8A20C' : '#0B6B4F'} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* activity + quick links */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="card-paper rounded-3xl p-5 sm:p-6">
          <h3 className="font-display mb-4 text-lg font-bold">Recent activity</h3>
          <div className="space-y-1">
            {activity.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.06 }}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-amberwash/40"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.bg}`}>{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-extrabold">{a.title}</span>
                  <span className="block truncate text-xs font-semibold text-ink/45">{a.sub}</span>
                </span>
                <span className={`shrink-0 text-[13.5px] font-extrabold ${a.positive ? 'text-forest' : 'text-ink'}`}>{a.amount}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-paper rounded-3xl p-5 sm:p-6">
          <h3 className="font-display mb-4 text-lg font-bold">Quick actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: 'Mark attendance', d: "Today's site entry", icon: <CalendarCheck size={20} />, to: '/admin/attendance', bg: 'bg-skywash text-steel' },
              { l: 'Add material', d: 'Purchase & stock', icon: <Package size={20} />, to: '/admin/materials?new=1', bg: 'bg-amberwash text-golddeep' },
              { l: 'Record income', d: 'Client receipt', icon: <Banknote size={20} />, to: '/admin/income?new=1', bg: 'bg-mint text-forest' },
              { l: 'New estimate', d: 'Quote for client', icon: <FileDown size={20} />, to: '/admin/estimates?new=1', bg: 'bg-tealwash text-tealpop' },
            ].map((q) => (
              <button
                key={q.l}
                onClick={() => navigate(q.to)}
                className="group cursor-pointer rounded-2xl border-[1.5px] border-line bg-white/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${q.bg} transition-transform group-hover:scale-110`}>{q.icon}</span>
                <span className="mt-2.5 block text-[13.5px] font-extrabold">{q.l}</span>
                <span className="block text-[11.5px] font-semibold text-ink/45">{q.d}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-night p-4 text-white">
            <CheckCircle2 size={18} className="shrink-0 text-gold" />
            <p className="text-xs leading-relaxed font-semibold text-white/70">
              Tip: supervisors can mark attendance from site — it syncs here instantly.
            </p>
          </div>
        </motion.div>
      </div>

      <Fab />
    </PageWrapper>
  );
}
