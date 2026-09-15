// ─── Admin · Attendance, Materials, Vehicles ───
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarCheck, Check, Fuel, Package, Plus, Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Fab, PageWrapper } from '../../components/layout';
import {
  Avatar, Badge, Btn, ConfirmDialog, EmptyState, Field, inputCls,
  Modal, PageHeader, SearchInput, staggerChild, staggerParent,
} from '../../components/ui';
import { fmtDate, inr, num, todayISO, uid } from '../../lib/format';
import type { Attendance, AttendanceStatus, Expense, Material, Vehicle, VehicleLog } from '../../types';
import { sessionProfile, toast, useApp } from '../../store/appStore';
import { DataTable, FilterChips, FormGrid, MoneyCell, RowActions, useAutoNew } from './Crud';

// ═══════════════ ATTENDANCE ═══════════════
const statuses: AttendanceStatus[] = ['Present', 'Half Day', 'Absent', 'Holiday'];
const statusStyle: Record<AttendanceStatus, string> = {
  Present: 'bg-forest text-white shadow-md shadow-forest/30',
  'Half Day': 'bg-gold text-night shadow-md shadow-gold/30',
  Absent: 'bg-clay text-white shadow-md shadow-clay/30',
  Holiday: 'bg-ink/15 text-ink/60',
};

interface DayRow { workerId: string; status: AttendanceStatus; advance: string; note: string }

export function AttendancePage() {
  const workersAll = useApp((s) => s.workers);
  const workers = useMemo(() => workersAll.filter((w) => w.active), [workersAll]);
  const projects = useApp((s) => s.projects);
  const attendance = useApp((s) => s.attendance);
  const saveDayAttendance = useApp((s) => s.saveDayAttendance);
  const pushNotification = useApp((s) => s.pushNotification);
  const me = useApp(sessionProfile);
  const [date, setDate] = useState(todayISO());
  const [projectId, setProjectId] = useState(projects.find((p) => p.status === 'Active')?.id ?? '');
  const [rows, setRows] = useState<DayRow[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!projectId && projects.length) setProjectId(projects.find((p) => p.status === 'Active')?.id ?? projects[0].id);
  }, [projects, projectId]);

  // prefill from existing records
  useEffect(() => {
    const existing = new Map(
      attendance.filter((a) => a.date === date).map((a) => [`${a.workerId}|${a.projectId}`, a]),
    );
    setRows(
      workers.map((w) => {
        const hit = existing.get(`${w.id}|${projectId}`);
        return {
          workerId: w.id,
          status: hit?.status ?? 'Present',
          advance: hit?.advance ? String(hit.advance) : '',
          note: hit?.note ?? '',
        };
      }),
    );
  }, [date, projectId, attendance, workers]);

  const setRow = (workerId: string, patch: Partial<DayRow>) =>
    setRows((rs) => rs.map((r) => (r.workerId === workerId ? { ...r, ...patch } : r)));

  const markAll = (status: AttendanceStatus) => setRows((rs) => rs.map((r) => ({ ...r, status })));

  const counts = useMemo(() => {
    const c: Record<string, number> = { Present: 0, 'Half Day': 0, Absent: 0, Holiday: 0 };
    rows.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);

  const save = () => {
    if (!projectId) return toast.error('Please select a project');
    const records: Attendance[] = rows.map((r) => ({
      id: uid('a'), workerId: r.workerId, projectId, date,
      status: r.status, advance: num(r.advance), note: r.note.trim() || undefined,
      markedBy: me?.id, createdAt: new Date().toISOString(),
    }));
    saveDayAttendance(records);
    const adv = records.reduce((x, r) => x + r.advance, 0);
    pushNotification({
      title: 'Attendance saved',
      message: `${fmtDate(date)} · ${counts.Present} present, ${counts['Half Day']} half-day${adv > 0 ? `, ${inr(adv)} advances` : ''}.`,
      type: 'success',
    });
    toast.success('Attendance saved', `${rows.length} workers marked for ${fmtDate(date)}.`);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const history = useMemo(
    () => attendance.filter((a) => a.date === date).sort((a, b) => a.workerId.localeCompare(b.workerId)),
    [attendance, date],
  );
  const workerName = (id: string) => workers.find((w) => w.id === id)?.name ?? useApp.getState().workers.find((w) => w.id === id)?.name ?? '—';
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  return (
    <PageWrapper>
      <PageHeader
        title="Attendance" subtitle="Mark daily site attendance with advances. Salary auto-calculates."
        actions={<Btn onClick={save}><Check size={17} /> Save Day</Btn>}
      />

      <div className="card-paper mb-4 flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Field label="Date"><input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls()} /></Field>
        </div>
        <div className="flex-1">
          <Field label="Project / site"><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        </div>
        <div className="flex gap-1.5">
          {(['Present', 'Half Day', 'Absent'] as AttendanceStatus[]).map((st) => (
            <button key={st} onClick={() => markAll(st)} className="cursor-pointer rounded-xl border-[1.5px] border-line px-3 py-2 text-xs font-extrabold text-ink/60 transition hover:border-gold hover:text-ink">
              All {st === 'Half Day' ? 'Half' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((st) => (
          <span key={st} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-extrabold text-ink/60">
            {st}: <span className="text-ink">{counts[st]}</span>
          </span>
        ))}
        <AnimatePresence>
          {savedFlash && (
            <motion.span initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-mint px-3.5 py-1.5 text-xs font-extrabold text-forest">
              ✓ Saved successfully
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={<CalendarCheck size={30} />} title="No active workers" hint="Add workers first, then mark their daily attendance here." />
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-3">
          {rows.map((r) => {
            const w = workers.find((x) => x.id === r.workerId);
            const wName = w?.name ?? `Worker #${r.workerId}`;
            return (
              <motion.div key={r.workerId} variants={staggerChild} className="card-paper rounded-2xl p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={wName} photo={w?.photoUrl} />
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-extrabold">{wName}</div>
                      <div className="text-xs font-bold text-ink/45">{w?.skill ?? '—'} · {inr(w?.rate ?? 0)}/day</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 lg:w-[340px]">
                    {statuses.map((st) => (
                      <button
                        key={st}
                        onClick={() => setRow(r.workerId, { status: st })}
                        className={`cursor-pointer rounded-xl px-1 py-2 text-[11px] font-extrabold transition ${
                          r.status === st ? statusStyle[st] : 'bg-ink/5 text-ink/45 hover:bg-ink/10'
                        }`}
                      >
                        {st === 'Half Day' ? 'Half' : st === 'Holiday' ? 'Off' : st}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 lg:w-[300px]">
                    <input
                      value={r.advance} onChange={(e) => setRow(r.workerId, { advance: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="Advance ₹" inputMode="numeric" className={`${inputCls()} lg:max-w-[110px]`}
                    />
                    <input
                      value={r.note} onChange={(e) => setRow(r.workerId, { note: e.target.value })}
                      placeholder="Note (optional)" className={`${inputCls()} flex-1`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display mb-3 text-lg font-bold">Records for {fmtDate(date)} <span className="text-sm font-bold text-ink/40">({history.length})</span></h3>
          <DataTable<Attendance>
            perPage={8}
            rows={history}
            columns={[
              { header: 'Worker', render: (a) => <span className="font-extrabold">{workerName(a.workerId)}</span> },
              { header: 'Project', render: (a) => projectName(a.projectId) },
              { header: 'Status', render: (a) => <Badge>{a.status}</Badge> },
              { header: 'Advance', render: (a) => <MoneyCell value={a.advance > 0 ? inr(a.advance) : '—'} /> },
              { header: 'Note', render: (a) => <span className="text-ink/50">{a.note ?? '—'}</span> },
            ]}
            empty={<p />}
          />
        </div>
      )}
      <Fab />
    </PageWrapper>
  );
}

// keep tree-shaken import referenced for future salary export
export type { Expense };

// ═══════════════ MATERIALS ═══════════════
const units = ['Nos', 'Bags', 'Kg', 'Brass', 'Sq.ft', 'Meter', 'Litres', 'Lot', 'Trip'];

const blankMaterial = (projectId: string): Material => ({
  id: uid('m'), date: todayISO(), name: '', vendor: '', projectId,
  qty: 0, unit: 'Nos', rate: 0, stockRemaining: 0, paid: false, billNumber: '', createdAt: new Date().toISOString(),
});

export function MaterialsPage() {
  const materials = useApp((s) => s.materials);
  const projects = useApp((s) => s.projects);
  const upsertMaterial = useApp((s) => s.upsertMaterial);
  const deleteMaterial = useApp((s) => s.deleteMaterial);
  const autoNew = useAutoNew();
  const [q, setQ] = useState('');
  const [paid, setPaid] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<Material>(() => blankMaterial(projects[0]?.id ?? ''));
  const [del, setDel] = useState<Material | null>(null);
  const set = (k: keyof Material, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (autoNew) { setForm(blankMaterial(projects[0]?.id ?? '')); setEditing(blankMaterial('x')); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNew]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...materials]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((m) =>
        (paid === 'All' || (paid === 'Paid' ? m.paid : !m.paid)) &&
        (!needle || m.name.toLowerCase().includes(needle) || (m.vendor ?? '').toLowerCase().includes(needle)),
      );
  }, [materials, q, paid]);

  const total = rows.reduce((x, m) => x + num(m.qty) * num(m.rate), 0);
  const unpaidTotal = rows.filter((m) => !m.paid).reduce((x, m) => x + num(m.qty) * num(m.rate), 0);

  const save = () => {
    if (form.name.trim().length < 2) return toast.error('Material name is required');
    if (num(form.qty) <= 0 || num(form.rate) <= 0) return toast.error('Quantity and rate must be greater than zero');
    if (!form.projectId) return toast.error('Please select a project');
    upsertMaterial({ ...form, name: form.name.trim(), qty: num(form.qty), rate: num(form.rate), stockRemaining: num(form.stockRemaining) });
    setEditing(null);
    toast.success('Material saved', form.name.trim());
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  return (
    <PageWrapper>
      <PageHeader
        title="Materials" subtitle={`Stock and purchases · ${inr(total)} total · ${inr(unpaidTotal)} unpaid.`}
        actions={<Btn onClick={() => { setForm(blankMaterial(projects[0]?.id ?? '')); setEditing(blankMaterial('x')); }}><Plus size={17} /> Add Material</Btn>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search material or vendor…" onSearch={setQ} className="sm:max-w-xs" />
        <FilterChips value={paid} onChange={setPaid} options={[{ value: 'All', label: 'All' }, { value: 'Paid', label: 'Paid' }, { value: 'Unpaid', label: 'Unpaid' }]} />
      </div>

      <DataTable<Material>
        rows={rows}
        columns={[
          { header: 'Date', render: (m) => fmtDate(m.date) },
          { header: 'Material', render: (m) => <span className="font-extrabold">{m.name}</span> },
          { header: 'Vendor', render: (m) => <span className="text-ink/60">{m.vendor || '—'}</span> },
          { header: 'Project', render: (m) => <span className="text-ink/60">{projectName(m.projectId)}</span> },
          { header: 'Qty', render: (m) => `${m.qty} ${m.unit}` },
          { header: 'Amount', render: (m) => <MoneyCell value={inr(num(m.qty) * num(m.rate))} /> },
          {
            header: 'Stock left',
            render: (m) => (
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${m.stockRemaining <= 0 ? 'bg-linen text-ink/50' : m.stockRemaining < num(m.qty) * 0.2 ? 'bg-blush text-clay' : 'bg-mint text-forest'}`}>
                {m.stockRemaining} {m.unit}
              </span>
            ),
          },
          {
            header: 'Paid',
            render: (m) => (
              <button
                onClick={() => { upsertMaterial({ ...m, paid: !m.paid }); toast.success(m.paid ? 'Marked unpaid' : 'Marked paid', m.name); }}
                className={`cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-extrabold transition ${m.paid ? 'bg-mint text-forest' : 'bg-blush text-clay hover:brightness-95'}`}
              >
                {m.paid ? 'Paid' : 'Unpaid'}
              </button>
            ),
          },
          { header: '', className: 'text-right', render: (m) => <RowActions onEdit={() => { setForm({ ...m }); setEditing(m); }} onDelete={() => setDel(m)} /> },
        ]}
        empty={<EmptyState icon={<Package size={30} />} title="No materials found" hint="Record cement, steel, bricks and every purchase with bills." action="Add Material" onAction={() => { setForm(blankMaterial(projects[0]?.id ?? '')); setEditing(blankMaterial('x')); }} />}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Material entry" subtitle="Purchases flow into project cost automatically." wide>
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Material name"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ultratech Cement" className={inputCls()} /></Field>
            <Field label="Vendor"><input value={form.vendor ?? ''} onChange={(e) => set('vendor', e.target.value)} placeholder="Shree Traders" className={inputCls()} /></Field>
            <Field label="Project"><select value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Date"><input type="date" value={form.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} className={inputCls()} /></Field>
            <Field label="Quantity"><input type="number" min={0} value={form.qty || ''} onChange={(e) => set('qty', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Unit"><select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls()}>{units.map((u) => <option key={u}>{u}</option>)}</select></Field>
            <Field label="Rate (₹)"><input type="number" min={0} value={form.rate || ''} onChange={(e) => set('rate', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Stock remaining"><input type="number" min={0} value={form.stockRemaining || ''} onChange={(e) => set('stockRemaining', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Bill number" hint="Optional"><input value={form.billNumber ?? ''} onChange={(e) => set('billNumber', e.target.value)} placeholder="BL-2601" className={inputCls()} /></Field>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-ink/5 px-4 py-2.5 text-sm font-bold">
                <input type="checkbox" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} className="h-4.5 w-4.5 accent-[#0B6B4F]" />
                Bill paid
              </label>
            </div>
          </FormGrid>
          <div className="flex items-center justify-between rounded-2xl bg-night px-4 py-3 text-white">
            <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Total amount</span>
            <span className="font-display text-xl font-bold">{inr(num(form.qty) * num(form.rate))}</span>
          </div>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={save}>Save Material</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete material?" confirmLabel="Yes, Delete"
        message={`Are you sure you want to delete "${del?.name}" (${del?.qty} ${del?.unit})? This removes its cost from the project.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteMaterial(del.id); toast.success('Material deleted', del.name); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ VEHICLES ═══════════════
const blankVehicle = (): Vehicle => ({
  id: uid('v'), name: '', vehicleNumber: '', type: 'JCB', ownerType: 'Hired', ratePerHour: 0, active: true, createdAt: new Date().toISOString(),
});

const blankLog = (vehicleId: string, projectId: string): VehicleLog => ({
  id: uid('vl'), vehicleId, projectId, date: todayISO(), hours: 0, dieselLitres: 0, dieselRate: 96, work: '', operatorName: '', createdAt: new Date().toISOString(),
});

export function VehiclesPage() {
  const vehicles = useApp((s) => s.vehicles);
  const logs = useApp((s) => s.vehicleLogs);
  const projects = useApp((s) => s.projects);
  const upsertVehicle = useApp((s) => s.upsertVehicle);
  const deleteVehicle = useApp((s) => s.deleteVehicle);
  const upsertVehicleLog = useApp((s) => s.upsertVehicleLog);
  const deleteVehicleLog = useApp((s) => s.deleteVehicleLog);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Vehicle>(blankVehicle());
  const [logFor, setLogFor] = useState<Vehicle | null>(null);
  const [logForm, setLogForm] = useState<VehicleLog>(() => blankLog('', ''));
  const [del, setDel] = useState<Vehicle | null>(null);
  const [delLog, setDelLog] = useState<VehicleLog | null>(null);
  const set = (k: keyof Vehicle, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const setL = (k: keyof VehicleLog, v: string | number) => setLogForm((f) => ({ ...f, [k]: v }));

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';
  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? '—';
  const logCost = (l: VehicleLog) => {
    const v = vehicles.find((x) => x.id === l.vehicleId);
    return num(l.hours) * num(v?.ratePerHour) + num(l.dieselLitres) * num(l.dieselRate);
  };
  const totalCost = logs.reduce((x, l) => x + logCost(l), 0);

  const saveVehicle = () => {
    if (form.name.trim().length < 2) return toast.error('Vehicle name is required');
    upsertVehicle({ ...form, name: form.name.trim(), ratePerHour: num(form.ratePerHour) });
    setEditing(null);
    toast.success('Vehicle saved', form.name.trim());
  };

  const openLog = (v: Vehicle) => {
    setLogFor(v);
    setLogForm(blankLog(v.id, projects.find((p) => p.status === 'Active')?.id ?? projects[0]?.id ?? ''));
  };

  const saveLog = () => {
    if (!logForm.vehicleId || !logForm.projectId) return toast.error('Vehicle and project are required');
    if (num(logForm.hours) <= 0 && num(logForm.dieselLitres) <= 0) return toast.error('Enter hours or diesel litres');
    upsertVehicleLog({ ...logForm, hours: num(logForm.hours), dieselLitres: num(logForm.dieselLitres), dieselRate: num(logForm.dieselRate) || 96 });
    setLogFor(null);
    toast.success('Log saved', `${inr(logCost({ ...logForm, hours: num(logForm.hours), dieselLitres: num(logForm.dieselLitres), dieselRate: num(logForm.dieselRate) || 96 }))} added to project cost.`);
  };

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs]);

  return (
    <PageWrapper>
      <PageHeader
        title="Vehicles" subtitle={`${vehicles.filter((v) => v.active).length} active machines · hire + diesel at ${inr(totalCost)} total.`}
        actions={<Btn onClick={() => { setForm(blankVehicle()); setEditing(blankVehicle()); }}><Plus size={17} /> New Vehicle</Btn>}
      />

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => {
          const vLogs = logs.filter((l) => l.vehicleId === v.id);
          const cost = vLogs.reduce((x, l) => x + logCost(l), 0);
          return (
            <motion.div key={v.id} variants={staggerChild} whileHover={{ y: -4 }} className="card-paper tap-lift rounded-3xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tealwash text-tealpop"><Truck size={20} /></span>
                  <div>
                    <h3 className="font-display text-[16px] leading-tight font-bold">{v.name}</h3>
                    <p className="mt-0.5 text-xs font-bold text-ink/50">{v.type} · {v.ownerType} · {v.vehicleNumber || 'No plate'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-cream/70 px-1 py-2">
                  <div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Rate/Hr</div>
                  <div className="text-[13px] font-extrabold">{inr(v.ratePerHour)}</div>
                </div>
                <div className="rounded-xl bg-cream/70 px-1 py-2">
                  <div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Logs</div>
                  <div className="text-[13px] font-extrabold">{vLogs.length}</div>
                </div>
                <div className="rounded-xl bg-tealwash/70 px-1 py-2">
                  <div className="text-[10px] font-extrabold tracking-wide text-tealpop/80 uppercase">Cost</div>
                  <div className="text-[13px] font-extrabold text-tealpop">{inr(cost)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Btn small variant="dark" className="flex-1" onClick={() => openLog(v)}><Fuel size={14} /> Add Log</Btn>
                <Btn small variant="outline" onClick={() => { setForm({ ...v }); setEditing(v); }}>Edit</Btn>
                <Btn small variant="outline" className="text-clay!" onClick={() => setDel(v)}>Delete</Btn>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      {vehicles.length === 0 && (
        <EmptyState icon={<Truck size={30} />} title="No vehicles yet" hint="Add JCBs, mixers and trucks, then log daily hours and diesel." action="New Vehicle" onAction={() => { setForm(blankVehicle()); setEditing(blankVehicle()); }} />
      )}

      <h3 className="font-display mt-7 mb-3 text-lg font-bold">Daily logs <span className="text-sm font-bold text-ink/40">({logs.length})</span></h3>
      <DataTable<VehicleLog>
        rows={sortedLogs}
        columns={[
          { header: 'Date', render: (l) => fmtDate(l.date) },
          { header: 'Vehicle', render: (l) => <span className="font-extrabold">{vehicleName(l.vehicleId)}</span> },
          { header: 'Project', render: (l) => <span className="text-ink/60">{projectName(l.projectId)}</span> },
          { header: 'Work', render: (l) => <span className="text-ink/60">{l.work || '—'}</span> },
          { header: 'Hrs × Diesel', render: (l) => `${l.hours}h · ${l.dieselLitres}L` },
          { header: 'Cost', render: (l) => <MoneyCell value={inr(logCost(l))} /> },
          { header: '', className: 'text-right', render: (l) => <RowActions onEdit={() => { const v = vehicles.find((x) => x.id === l.vehicleId); if (v) { setLogFor(v); setLogForm({ ...l }); } }} onDelete={() => setDelLog(l)} /> },
        ]}
        empty={<EmptyState icon={<Fuel size={30} />} title="No logs yet" hint="Daily machine entries appear here with hire + diesel cost." />}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Vehicle details" subtitle="Hire rate applies to every logged hour.">
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Machine name"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="JCB 3DX Backhoe" className={inputCls()} /></Field>
            <Field label="Number plate"><input value={form.vehicleNumber ?? ''} onChange={(e) => set('vehicleNumber', e.target.value)} placeholder="GJ-18-AB-4521" className={inputCls()} /></Field>
            <Field label="Type"><select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls()}>{['JCB', 'Excavator', 'Truck', 'Mixer', 'Crane', 'Roller', 'Other'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Ownership"><select value={form.ownerType} onChange={(e) => set('ownerType', e.target.value)} className={inputCls()}>{['Owned', 'Hired', 'Rented'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Rate per hour (₹)"><input type="number" min={0} value={form.ratePerHour || ''} onChange={(e) => set('ratePerHour', Number(e.target.value))} className={inputCls()} /></Field>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4.5 w-4.5 accent-[#9A6200]" /> Active</label>
            </div>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={saveVehicle}>Save Vehicle</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!logFor} onClose={() => setLogFor(null)} title={`Log — ${logFor?.name ?? ''}`} subtitle="Hours × hire rate plus diesel at pump rate.">
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Date"><input type="date" value={logForm.date} max={todayISO()} onChange={(e) => setL('date', e.target.value)} className={inputCls()} /></Field>
            <Field label="Project"><select value={logForm.projectId} onChange={(e) => setL('projectId', e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Hours worked"><input type="number" min={0} step={0.5} value={logForm.hours || ''} onChange={(e) => setL('hours', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Operator"><input value={logForm.operatorName ?? ''} onChange={(e) => setL('operatorName', e.target.value)} placeholder="Driver name" className={inputCls()} /></Field>
            <Field label="Diesel (litres)"><input type="number" min={0} value={logForm.dieselLitres || ''} onChange={(e) => setL('dieselLitres', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Diesel rate (₹/L)"><input type="number" min={0} value={logForm.dieselRate || ''} onChange={(e) => setL('dieselRate', Number(e.target.value))} className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Work done"><input value={logForm.work ?? ''} onChange={(e) => setL('work', e.target.value)} placeholder="Foundation excavation" className={inputCls()} /></Field></div>
          </FormGrid>
          <div className="flex items-center justify-between rounded-2xl bg-night px-4 py-3 text-white">
            <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Log cost</span>
            <span className="font-display text-xl font-bold">{inr(num(logForm.hours) * num(vehicles.find((v) => v.id === logForm.vehicleId)?.ratePerHour) + num(logForm.dieselLitres) * (num(logForm.dieselRate) || 96))}</span>
          </div>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setLogFor(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={saveLog}>Save Log</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete vehicle?" confirmLabel="Yes, Delete"
        message={`Are you sure you want to delete "${del?.name}"? All its daily logs will also be removed.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteVehicle(del.id); toast.success('Vehicle deleted', del.name); } setDel(null); }}
      />
      <ConfirmDialog
        open={!!delLog} title="Delete log?" confirmLabel="Yes, Delete"
        message={`Delete the log for ${fmtDate(delLog?.date)} (${delLog?.hours}h)? This reduces project cost.`}
        onCancel={() => setDelLog(null)}
        onConfirm={() => { if (delLog) { deleteVehicleLog(delLog.id); toast.success('Log deleted'); } setDelLog(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}
