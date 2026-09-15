// ─── Supervisor portal · today's overview, attendance, materials ───
// Note: supervisors never see income, expenses or profit — site tools only.
import { motion } from 'framer-motion';
import {
  ArrowRight, Building2, CalendarCheck, Check, HardHat, Package, Plus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../../components/layout';
import {
  AnimatedCounter, Avatar, Btn, ConfirmDialog, EmptyState, Field,
  inputCls, Modal, PageHeader, staggerChild, staggerParent,
} from '../../components/ui';
import { DataTable, MoneyCell } from '../admin/Crud';
import { fmtDate, inr, num, todayISO, uid } from '../../lib/format';
import type { AttendanceStatus, Material } from '../../types';
import { sessionProfile, toast, useApp } from '../../store/appStore';

const statuses: AttendanceStatus[] = ['Present', 'Half Day', 'Absent', 'Holiday'];
const statusStyle: Record<AttendanceStatus, string> = {
  Present: 'bg-forest text-white shadow-md shadow-forest/30',
  'Half Day': 'bg-gold text-night shadow-md shadow-gold/30',
  Absent: 'bg-clay text-white shadow-md shadow-clay/30',
  Holiday: 'bg-ink/15 text-ink/60',
};

// ───────── DASHBOARD ─────────
export function SupervisorDashboard() {
  const me = useApp(sessionProfile);
  const workersAll = useApp((s) => s.workers);
  const workers = useMemo(() => workersAll.filter((w) => w.active), [workersAll]);
  const projectsAll = useApp((s) => s.projects);
  const projects = useMemo(() => projectsAll.filter((p) => p.status === 'Active'), [projectsAll]);
  const attendanceAll = useApp((s) => s.attendance);
  const today = useMemo(() => attendanceAll.filter((a) => a.date === todayISO()), [attendanceAll]);
  const materials = useApp((s) => s.materials);

  const present = today.filter((a) => a.status === 'Present' || a.status === 'Half Day').length;

  const cards = [
    { label: 'Active sites', value: projects.length, fmt: (n: number) => String(Math.round(n)), icon: <Building2 size={20} />, bg: 'bg-skywash', fg: 'text-steel' },
    { label: 'Workers', value: workers.length, fmt: (n: number) => String(Math.round(n)), icon: <HardHat size={20} />, bg: 'bg-amberwash', fg: 'text-golddeep' },
    { label: 'Marked today', value: today.length, fmt: (n: number) => `${Math.round(n)} / ${workers.length}`, icon: <CalendarCheck size={20} />, bg: 'bg-mint', fg: 'text-forest' },
    { label: 'Present today', value: present, fmt: (n: number) => String(Math.round(n)), icon: <Check size={20} />, bg: 'bg-tealwash', fg: 'text-tealpop' },
  ];

  const recentMaterials = [...materials].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const projectName = (id: string) => useApp.getState().projects.find((p) => p.id === id)?.name ?? '—';

  return (
    <PageWrapper>
      <PageHeader title={`Hello, ${me?.name.split(' ')[0] ?? 'Supervisor'}!`} subtitle={`${fmtDate(todayISO())} · Here's today's site status.`} />

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={staggerChild} className="card-paper rounded-3xl p-4 sm:p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.fg}`}>{c.icon}</div>
            <div className="mt-3 text-[11px] font-extrabold tracking-wide text-ink/50 uppercase">{c.label}</div>
            <div className="font-display mt-0.5 text-[22px] font-bold"><AnimatedCounter value={c.value} format={c.fmt} /></div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="card-night grain relative overflow-hidden rounded-3xl p-6">
          <h3 className="font-display relative text-lg font-bold text-white">Today's tasks</h3>
          <div className="relative mt-4 space-y-2.5">
            <Link to="/supervisor/attendance" className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 ring-inset transition hover:bg-white/12">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold text-night"><CalendarCheck size={20} /></span>
              <span className="flex-1">
                <span className="block text-[14px] font-extrabold text-white">Mark attendance</span>
                <span className="block text-xs font-semibold text-white/50">{today.length === 0 ? 'Not started yet' : `${today.length} of ${workers.length} marked`}</span>
              </span>
              <ArrowRight size={18} className="text-gold" />
            </Link>
            <Link to="/supervisor/materials" className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 ring-inset transition hover:bg-white/12">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-tealpop text-white"><Package size={20} /></span>
              <span className="flex-1">
                <span className="block text-[14px] font-extrabold text-white">Add material entry</span>
                <span className="block text-xs font-semibold text-white/50">Log deliveries received on site</span>
              </span>
              <ArrowRight size={18} className="text-gold" />
            </Link>
          </div>
        </div>

        <div className="card-paper rounded-3xl p-5">
          <h3 className="font-display mb-3 text-lg font-bold">Latest material entries</h3>
          {recentMaterials.length === 0 ? <p className="text-sm font-semibold text-ink/45">No entries yet.</p> : (
            <div className="space-y-2">
              {recentMaterials.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold">{m.name}</div>
                    <div className="text-[11px] font-bold text-ink/45">{fmtDate(m.date)} · {projectName(m.projectId)}</div>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-extrabold">{m.qty} {m.unit}</span>
                </div>
              ))}
            </div>
          )}
          <h3 className="font-display mt-5 mb-3 text-lg font-bold">Active sites</h3>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <span key={p.id} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-extrabold text-ink/65">{p.name}</span>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ───────── ATTENDANCE ─────────
interface DayRow { workerId: string; status: AttendanceStatus; advance: string; note: string }

export function SupervisorAttendance() {
  const workersAll = useApp((s) => s.workers);
  const workers = useMemo(() => workersAll.filter((w) => w.active), [workersAll]);
  const projectsAll = useApp((s) => s.projects);
  const projects = useMemo(() => projectsAll.filter((p) => p.status === 'Active'), [projectsAll]);
  const attendance = useApp((s) => s.attendance);
  const saveDayAttendance = useApp((s) => s.saveDayAttendance);
  const pushNotification = useApp((s) => s.pushNotification);
  const me = useApp(sessionProfile);
  const [date, setDate] = useState(todayISO());
  const [projectId, setProjectId] = useState('');
  const [rows, setRows] = useState<DayRow[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!projectId && projects.length) setProjectId(projects[0].id);
  }, [projects, projectId]);

  useEffect(() => {
    const existing = new Map(
      attendance.filter((a) => a.date === date).map((a) => [`${a.workerId}|${a.projectId}`, a]),
    );
    setRows(workers.map((w) => {
      const hit = existing.get(`${w.id}|${projectId}`);
      return { workerId: w.id, status: hit?.status ?? 'Present', advance: hit?.advance ? String(hit.advance) : '', note: hit?.note ?? '' };
    }));
    setDone(false);
  }, [date, projectId, attendance, workers]);

  const setRow = (workerId: string, patch: Partial<DayRow>) =>
    setRows((rs) => rs.map((r) => (r.workerId === workerId ? { ...r, ...patch } : r)));

  const save = () => {
    if (!projectId) return toast.error('Please select a site');
    saveDayAttendance(rows.map((r) => ({
      id: uid('a'), workerId: r.workerId, projectId, date,
      status: r.status, advance: num(r.advance), note: r.note.trim() || undefined,
      markedBy: me?.id, createdAt: new Date().toISOString(),
    })));
    pushNotification({ title: 'Attendance updated by supervisor', message: `${me?.name ?? 'Supervisor'} marked ${fmtDate(date)}.`, type: 'info' });
    toast.success('Attendance saved', `${rows.length} workers marked.`);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Mark Attendance" subtitle="Fast site entry — tap a status per worker, then save."
        actions={<Btn onClick={save}><Check size={17} /> Save Day</Btn>}
      />
      <div className="card-paper mb-4 flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Field label="Date"><input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls()} /></Field>
        </div>
        <div className="flex-1">
          <Field label="Site"><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        </div>
        {done && <span className="rounded-full bg-mint px-4 py-2 text-xs font-extrabold text-forest">✓ Saved successfully</span>}
      </div>

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-3">
        {rows.map((r) => {
          const w = workers.find((x) => x.id === r.workerId);
          const wName = w?.name ?? `Worker #${r.workerId}`;
          return (
            <motion.div key={r.workerId} variants={staggerChild} className="card-paper rounded-2xl p-3.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={wName} photo={w?.photoUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-extrabold">{wName}</div>
                    <div className="text-xs font-bold text-ink/45">{w?.skill ?? '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 lg:w-[340px]">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => setRow(r.workerId, { status: st })}
                      className={`cursor-pointer rounded-xl px-1 py-2 text-[11px] font-extrabold transition ${r.status === st ? statusStyle[st] : 'bg-ink/5 text-ink/45 hover:bg-ink/10'}`}
                    >
                      {st === 'Half Day' ? 'Half' : st === 'Holiday' ? 'Off' : st}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 lg:w-[300px]">
                  <input value={r.advance} onChange={(e) => setRow(r.workerId, { advance: e.target.value.replace(/[^0-9]/g, '') })} placeholder="Advance ₹" inputMode="numeric" className={`${inputCls()} lg:max-w-[110px]`} />
                  <input value={r.note} onChange={(e) => setRow(r.workerId, { note: e.target.value })} placeholder="Note" className={`${inputCls()} flex-1`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </PageWrapper>
  );
}

// ───────── MATERIALS ─────────
const units = ['Nos', 'Bags', 'Kg', 'Brass', 'Sq.ft', 'Meter', 'Litres', 'Lot', 'Trip'];

export function SupervisorMaterials() {
  const materials = useApp((s) => s.materials);
  const projectsAll = useApp((s) => s.projects);
  const projects = useMemo(() => projectsAll.filter((p) => p.status === 'Active'), [projectsAll]);
  const upsertMaterial = useApp((s) => s.upsertMaterial);
  const [open, setOpen] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [form, setForm] = useState({ name: '', vendor: '', projectId: '', qty: '', unit: 'Nos', rate: '', date: todayISO(), billNumber: '' });

  useEffect(() => {
    if (!form.projectId && projects.length) setForm((f) => ({ ...f, projectId: projects[0].id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  const rows = useMemo(() => [...materials].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30), [materials]);
  const projectName = (id: string) => useApp.getState().projects.find((p) => p.id === id)?.name ?? '—';

  const trySave = () => {
    if (form.name.trim().length < 2) return toast.error('Material name is required');
    if (num(form.qty) <= 0) return toast.error('Quantity must be greater than zero');
    if (!form.projectId) return toast.error('Please select a site');
    setConfirmSave(true);
  };

  const save = () => {
    const m: Material = {
      id: uid('m'), date: form.date, name: form.name.trim(), vendor: form.vendor.trim(),
      projectId: form.projectId, qty: num(form.qty), unit: form.unit, rate: num(form.rate),
      stockRemaining: num(form.qty), paid: false, billNumber: form.billNumber.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    upsertMaterial(m);
    setConfirmSave(false);
    setOpen(false);
    setForm({ name: '', vendor: '', projectId: projects[0]?.id ?? '', qty: '', unit: 'Nos', rate: '', date: todayISO(), billNumber: '' });
    toast.success('Material entry added', m.name);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Material Entries" subtitle="Log every delivery received on site."
        actions={<Btn onClick={() => setOpen(true)}><Plus size={17} /> Add Entry</Btn>}
      />
      <DataTable<Material>
        rows={rows}
        columns={[
          { header: 'Date', render: (m) => fmtDate(m.date) },
          { header: 'Material', render: (m) => <span className="font-extrabold">{m.name}</span> },
          { header: 'Vendor', render: (m) => <span className="text-ink/60">{m.vendor || '—'}</span> },
          { header: 'Site', render: (m) => <span className="text-ink/60">{projectName(m.projectId)}</span> },
          { header: 'Qty', render: (m) => `${m.qty} ${m.unit}` },
          { header: 'Bill', render: (m) => <span className="font-mono text-xs text-ink/50">{m.billNumber || '—'}</span> },
        ]}
        empty={<EmptyState icon={<Package size={30} />} title="No entries yet" hint="Log cement, sand, steel and every delivery here." action="Add Entry" onAction={() => setOpen(true)} />}
      />
      <p className="mt-3 text-xs font-semibold text-ink/40">Note: supervisors can add entries but cannot edit, delete or view billing totals.</p>

      <Modal open={open} onClose={() => setOpen(false)} title="New material entry" subtitle="Record what arrived on site today.">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Material name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ultratech Cement" className={inputCls()} /></Field></div>
          <Field label="Vendor / supplier"><input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Shree Traders" className={inputCls()} /></Field>
          <Field label="Site"><select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Quantity"><input type="number" min={0} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className={inputCls()} /></Field>
          <Field label="Unit"><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls()}>{units.map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Rate (₹) — if on bill"><input type="number" min={0} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="Optional" className={inputCls()} /></Field>
          <Field label="Bill number"><input value={form.billNumber} onChange={(e) => setForm({ ...form, billNumber: e.target.value })} placeholder="Optional" className={inputCls()} /></Field>
          <div className="flex gap-2.5 sm:col-span-2">
            <Btn variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn className="flex-1" onClick={trySave}>Add Entry</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSave} title="Confirm entry?" confirmLabel="Yes, Add It"
        message={`Add "${form.name.trim()}" (${form.qty} ${form.unit}) to ${projectName(form.projectId)}? ${form.rate ? `Rate ${inr(num(form.rate))} will be recorded.` : ''}`}
        onCancel={() => setConfirmSave(false)}
        onConfirm={save}
      />
    </PageWrapper>
  );
}

export { MoneyCell };
