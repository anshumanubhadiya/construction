// ─── Worker portal · dashboard, attendance calendar, earnings, profile ───
import { motion } from 'framer-motion';
import {
  BadgeCheck, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight,
  Printer, Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import {
  AnimatedCounter, Avatar, Badge, Btn, EmptyState, Field, inputCls,
  PageHeader, staggerChild, staggerParent,
} from '../../components/ui';
import { DataTable, MoneyCell } from '../admin/Crud';
import { lastNMonths, monthKey, monthLabel } from '../../lib/format';
import { fmtDate, inr, num, todayISO } from '../../lib/format';
import { printSalary } from '../../lib/pdf';
import { sessionProfile, toast, useApp, workerMonthSummary } from '../../store/appStore';

function useWorker() {
  const me = useApp(sessionProfile);
  const worker = useApp((s) => s.workers.find((w) => w.id === me?.linkedId));
  return { me, worker };
}

// ───────── month calendar ─────────
export function AttendanceCalendar({ workerId, month, onMonth }: { workerId: string; month: string; onMonth: (m: string) => void }) {
  const attendanceAll = useApp((s) => s.attendance);
  const attendance = useMemo(() => attendanceAll.filter((a) => a.workerId === workerId && a.date.slice(0, 7) === month), [attendanceAll]);
  const [y, m] = month.split('-').map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = todayISO();

  const byDay = new Map(attendance.map((a) => [Number(a.date.slice(8, 10)), a.status]));
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (dir: number) => {
    const d = new Date(y, m - 1 + dir, 1);
    onMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const styleFor = (day: number | null): string => {
    if (!day) return '';
    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (key > today) return 'bg-ink/5 text-ink/30';
    const st = byDay.get(day);
    if (st === 'Present') return 'bg-mint text-forest ring-1 ring-forest/20 ring-inset';
    if (st === 'Half Day') return 'bg-amberwash text-bronze ring-1 ring-gold/30 ring-inset';
    if (st === 'Absent') return 'bg-blush text-clay ring-1 ring-clay/20 ring-inset';
    if (st === 'Holiday') return 'bg-linen text-ink/40';
    return new Date(key).getDay() === 0 ? 'bg-linen/60 text-ink/30' : 'bg-blush/40 text-clay/60';
  };

  return (
    <div className="card-paper rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-[1.5px] border-line text-ink/60 transition hover:border-gold"><ChevronLeft size={17} /></button>
        <h3 className="font-display text-lg font-bold">{monthLabel(month)}</h3>
        <button onClick={() => shift(1)} disabled={month >= todayISO().slice(0, 7)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-[1.5px] border-line text-ink/60 transition hover:border-gold disabled:opacity-40"><ChevronRight size={17} /></button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold tracking-wide text-ink/40 uppercase">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.012, 0.4) }}
            className={`grid aspect-square place-items-center rounded-xl text-[13px] font-extrabold ${styleFor(day)} ${day ? '' : 'invisible'}`}
          >
            {day ?? ''}
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11.5px] font-extrabold text-ink/55">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-forest" /> Present</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-gold" /> Half day</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-clay" /> Absent</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-ink/15" /> Off / future</span>
      </div>
    </div>
  );
}

// ───────── DASHBOARD ─────────
export function WorkerDashboard() {
  const { me, worker } = useWorker();
  const month = todayISO().slice(0, 7);
  const st = useApp((s) => s);
  const summary = worker ? workerMonthSummary(st, worker.id, month) : null;
  const recent = worker
    ? st.attendance.filter((a) => a.workerId === worker.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
    : [];
  const projects = useApp((s) => s.projects);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  if (!worker) {
    return <PageWrapper><EmptyState icon={<BadgeCheck size={30} />} title="Account not linked yet" hint="The admin is linking your login to your worker record. Please check back soon." /></PageWrapper>;
  }

  const cards = [
    { label: 'Days worked', value: summary?.days ?? 0, format: (n: number) => `${n} days`, bg: 'bg-skywash', fg: 'text-steel' },
    { label: 'Earned', value: summary?.gross ?? 0, format: inr, bg: 'bg-mint', fg: 'text-forest' },
    { label: 'Advance taken', value: summary?.advance ?? 0, format: inr, bg: 'bg-blush', fg: 'text-clay' },
    { label: 'You will receive', value: summary?.net ?? 0, format: inr, bg: 'bg-amberwash', fg: 'text-golddeep' },
  ];

  return (
    <PageWrapper>
      <div className="card-night grain relative mb-5 overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gold/20 blur-[80px]" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar name={worker.name} size="lg" photo={worker.photoUrl} />
          <div className="flex-1">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold text-white sm:text-3xl">
              Hello, {me?.name.split(' ')[0] ?? worker.name.split(' ')[0]}!
            </motion.h1>
            <p className="mt-1 text-[13px] font-bold text-white/55">{worker.skill} · {inr(worker.rate)} per day · {monthLabel(month)}</p>
          </div>
          <div className="rounded-2xl bg-white/8 px-5 py-3 text-right ring-1 ring-white/12 ring-inset">
            <div className="text-[10.5px] font-extrabold tracking-widest text-gold uppercase">This month net</div>
            <div className="font-display text-2xl font-bold text-white"><AnimatedCounter value={summary?.net ?? 0} /></div>
          </div>
        </div>
      </div>

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={staggerChild} className="card-paper rounded-3xl p-4 sm:p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.fg}`}>
              {c.label.includes('Days') ? <CalendarDays size={20} /> : <Wallet size={20} />}
            </div>
            <div className="mt-3 text-[11px] font-extrabold tracking-wide text-ink/50 uppercase">{c.label}</div>
            <div className="font-display mt-0.5 text-[22px] font-bold"><AnimatedCounter value={c.value} format={c.format} /></div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AttendanceCalendar workerId={worker.id} month={month} onMonth={() => {}} />
        <div className="card-paper rounded-3xl p-5">
          <h3 className="font-display mb-3 text-lg font-bold">Recent days</h3>
          <div className="space-y-2">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3.5 py-2.5">
                <div>
                  <div className="text-[13px] font-extrabold">{fmtDate(a.date)}</div>
                  <div className="text-[11px] font-bold text-ink/45">{projectName(a.projectId)}{a.advance > 0 ? ` · Advance ${inr(a.advance)}` : ''}</div>
                </div>
                <Badge>{a.status}</Badge>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm font-semibold text-ink/45">No attendance yet.</p>}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ───────── ATTENDANCE HISTORY ─────────
export function WorkerAttendance() {
  const { worker } = useWorker();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const attendanceAll = useApp((s) => s.attendance);
  const rows = worker
    ? attendanceAll.filter((a) => a.workerId === worker.id && a.date.slice(0, 7) === month).sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const projects = useApp((s) => s.projects);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  if (!worker) return <PageWrapper><EmptyState icon={<CalendarCheck size={30} />} title="Account not linked yet" hint="Please check back after the admin links your worker record." /></PageWrapper>;

  return (
    <PageWrapper>
      <PageHeader title="My Attendance" subtitle="Your complete day-by-day record." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <AttendanceCalendar workerId={worker.id} month={month} onMonth={setMonth} />
        <DataTable
          perPage={8}
          rows={rows}
          columns={[
            { header: 'Date', render: (a) => <span className="font-extrabold">{fmtDate(a.date)}</span> },
            { header: 'Site', render: (a) => projectName(a.projectId) },
            { header: 'Status', render: (a) => <Badge>{a.status}</Badge> },
            { header: 'Advance', render: (a) => <MoneyCell value={a.advance > 0 ? inr(a.advance) : '—'} /> },
          ]}
          empty={<EmptyState icon={<CalendarCheck size={30} />} title={`Nothing in ${monthLabel(month)}`} hint="No records for this month yet." />}
        />
      </div>
    </PageWrapper>
  );
}

// ───────── EARNINGS ─────────
export function WorkerEarnings() {
  const { worker } = useWorker();
  const settings = useApp((s) => s.settings);
  const months = useMemo(() => lastNMonths(6), []);
  const st = useApp((s) => s);
  const summaries = worker ? months.map((m) => ({ month: m, ...workerMonthSummary(st, worker.id, m) })) : [];

  const total = summaries.reduce((x, r) => ({ gross: x.gross + r.gross, advance: x.advance + r.advance, net: x.net + r.net }), { gross: 0, advance: 0, net: 0 });

  const download = (m: string) => {
    if (!worker) return;
    const ms = summaries.find((x) => x.month === m);
    if (!ms || (ms.gross === 0 && ms.advance === 0)) return toast.error('No earnings in this month');
    printSalary(settings, monthLabel(m), [{
      name: worker.name, skill: worker.skill, rate: num(worker.rate),
      present: ms.present, half: ms.half, absent: ms.absent,
      gross: ms.gross, advance: ms.advance, net: ms.net,
    }]);
    toast.success('Salary slip sent to printer', monthLabel(m));
  };

  if (!worker) return <PageWrapper><EmptyState icon={<Wallet size={30} />} title="Account not linked yet" hint="Please check back after the admin links your worker record." /></PageWrapper>;

  return (
    <PageWrapper>
      <PageHeader title="My Earnings" subtitle="Month-wise days, advances and net pay." />
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: '6-month gross', v: total.gross, c: 'text-ink' },
          { l: 'Advances', v: total.advance, c: 'text-clay' },
          { l: 'Net received', v: total.net, c: 'text-forest' },
        ].map((x) => (
          <div key={x.l} className="card-paper rounded-2xl p-4">
            <div className="text-[10.5px] font-extrabold tracking-widest text-ink/45 uppercase">{x.l}</div>
            <div className={`font-display text-lg font-bold sm:text-xl ${x.c}`}>{inr(x.v)}</div>
          </div>
        ))}
      </div>
      <DataTable
        perPage={8}
        rows={summaries.map((r) => ({ ...r, id: r.month }))}
        columns={[
          { header: 'Month', render: (r) => <span className="font-extrabold">{monthLabel(r.month)}</span> },
          { header: 'Days', render: (r) => `${r.days} (${r.present}P · ${r.half}H · ${r.absent}A)` },
          { header: 'Rate', render: () => inr(worker.rate) },
          { header: 'Gross', render: (r) => inr(r.gross) },
          { header: 'Advance', render: (r) => <span className="font-extrabold text-clay">{inr(r.advance)}</span> },
          { header: 'Net', render: (r) => <MoneyCell value={inr(r.net)} positive /> },
          { header: '', className: 'text-right', render: (r) => <Btn small variant="outline" onClick={() => download(r.month)}><Printer size={14} /> Slip</Btn> },
        ]}
        empty={<p />}
      />
    </PageWrapper>
  );
}

// ───────── PROFILE ─────────
export function WorkerProfile() {
  const { me, worker } = useWorker();
  const upsertWorker = useApp((s) => s.upsertWorker);
  const changePasswordCloud = useApp((s) => s.changePassword);
  const [emergency, setEmergency] = useState(worker?.emergencyContact ?? '');
  const [photo, setPhoto] = useState(worker?.photoUrl ?? '');

  if (!worker) return <PageWrapper><EmptyState icon={<BadgeCheck size={30} />} title="Account not linked yet" hint="Please check back after the admin links your worker record." /></PageWrapper>;

  const masked = worker.aadhaar && worker.aadhaar.length >= 4
    ? `XXXX-XXXX-${worker.aadhaar.replace(/\D/g, '').slice(-4)}`
    : 'XXXX-XXXX-XXXX';

  const save = () => {
    upsertWorker({ ...worker, emergencyContact: emergency, photoUrl: photo || undefined });
    toast.success('Profile updated');
  };

  const changePw = async (current: string, next: string) => {
    if (!me) return;
    if (next.length < 8) return toast.error('New password must be at least 8 characters');
    try {
      await changePasswordCloud(current, next);
    } catch (err: unknown) {
      toast.error('Password change failed', (err as Error)?.message || '');
    }
  };

  return (
    <PageWrapper>
      <PageHeader title="My Profile" subtitle="Your registered details with the company." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-paper rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={worker.name} size="lg" photo={worker.photoUrl} />
            <div>
              <h3 className="font-display text-xl font-bold">{worker.name}</h3>
              <p className="text-[13px] font-bold text-ink/50">{worker.skill} · {inr(worker.rate)}/day</p>
              <p className="mt-1"><Badge>{worker.active ? 'Active' : 'Inactive'}</Badge></p>
            </div>
          </div>
          <div className="space-y-2.5 text-[13.5px] font-semibold">
            {[
              ['Phone', worker.phone ?? '—'],
              ['Address', worker.address ?? '—'],
              ['Aadhaar', masked],
              ['Bank account', worker.bankAccount ? `••••${worker.bankAccount.slice(-4)}` : '—'],
              ['Member since', fmtDate(worker.createdAt)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-3 rounded-xl bg-cream/60 px-3.5 py-2.5">
                <span className="text-ink/50">{l}</span><span className="text-right font-extrabold">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card-paper rounded-3xl p-6">
            <h3 className="font-display mb-4 text-lg font-bold">Editable details</h3>
            <div className="grid gap-3.5">
              <Field label="Emergency contact"><input value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="+91 …" className={inputCls()} /></Field>
              <Field label="Photo URL" hint="Paste an image link"><input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" className={inputCls()} /></Field>
              <Btn onClick={save}>Save Changes</Btn>
            </div>
          </div>
          <PasswordCard onChange={changePw} />
        </div>
      </div>
    </PageWrapper>
  );
}

function PasswordCard({ onChange }: { onChange: (current: string, next: string) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  return (
    <div className="card-paper rounded-3xl p-6">
      <h3 className="font-display mb-4 text-lg font-bold">Change password</h3>
      <div className="grid gap-3.5">
        <Field label="Current password"><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls()} /></Field>
        <Field label="New password"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls()} /></Field>
        <Btn variant="dark" onClick={() => { onChange(current, next); setCurrent(''); setNext(''); }}>Update Password</Btn>
      </div>
    </div>
  );
}

export { monthKey };
