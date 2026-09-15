// ─── Admin · Projects, Clients, Workers ───
import { motion } from 'framer-motion';
import {
  Briefcase, Building2, CalendarDays, HardHat, MapPin, Phone, Plus, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Fab, PageWrapper } from '../../components/layout';
import {
  Avatar, Badge, Btn, ConfirmDialog, EmptyState, Field, inputCls,
  Modal, PageHeader, ProgressBar, SearchInput, staggerChild, staggerParent,
} from '../../components/ui';
import { fmtDate, inr, num, todayISO, uid } from '../../lib/format';
import type { Client, Project, ProjectStatus, Worker } from '../../types';
import {
  currentMonthKey, projectStats, toast, useApp, workerMonthSummary,
} from '../../store/appStore';
import { FilterChips, FormGrid, RowActions } from './Crud';

// ═══════════════ PROJECTS ═══════════════
const blankProject = (clientId: string): Project => ({
  id: uid('p'), name: '', clientId, location: 'Dahegam', budget: 0,
  startDate: todayISO(), endDate: '', status: 'Active', description: '', progress: 0,
  createdAt: new Date().toISOString(),
});

export function ProjectsPage() {
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);
  const upsertProject = useApp((s) => s.upsertProject);
  const deleteProject = useApp((s) => s.deleteProject);
  const st = useApp((s) => s);
  const statsOf = (id: string) => projectStats(st, id);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'All' | ProjectStatus>('All');
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Project>(() => blankProject(clients[0]?.id ?? ''));
  const [del, setDel] = useState<Project | null>(null);

  const openNew = () => { setForm(blankProject(clients[0]?.id ?? '')); setEditing({ ...blankProject('new') }); };
  const openEdit = (p: Project) => { setForm({ ...p }); setEditing(p); };
  const set = (k: keyof Project, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) =>
      (status === 'All' || p.status === status) &&
      (!needle || p.name.toLowerCase().includes(needle) || (p.location ?? '').toLowerCase().includes(needle)),
    );
  }, [projects, q, status]);

  const save = () => {
    if (form.name.trim().length < 3) return toast.error('Project name is too short');
    if (!form.clientId) return toast.error('Please select a client');
    if (num(form.budget) <= 0) return toast.error('Budget must be greater than zero');
    upsertProject({ ...form, name: form.name.trim(), budget: num(form.budget), progress: Math.max(0, Math.min(100, num(form.progress))) });
    setEditing(null);
    toast.success('Project saved', form.name.trim());
  };

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—';

  return (
    <PageWrapper>
      <PageHeader
        title="Projects" subtitle={`${projects.length} sites · track budget, spend and profit per project.`}
        actions={<Btn onClick={openNew}><Plus size={17} /> New Project</Btn>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search projects or locations…" onSearch={setQ} className="sm:max-w-xs" />
        <FilterChips
          value={status} onChange={setStatus}
          options={[{ value: 'All', label: 'All' }, { value: 'Active', label: 'Active' }, { value: 'Planning', label: 'Planning' }, { value: 'On Hold', label: 'On Hold' }, { value: 'Completed', label: 'Completed' }]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Building2 size={30} />} title="No projects found" hint="Create your first site to start tracking budget and profit." action="New Project" onAction={openNew} />
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
          {rows.map((p) => {
            const st = statsOf(p.id);
            return (
              <motion.div key={p.id} variants={staggerChild} whileHover={{ y: -4 }} className="card-paper tap-lift rounded-3xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-night text-gold"><Building2 size={20} /></span>
                    <div>
                      <h3 className="font-display text-[17px] leading-tight font-bold">{p.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-ink/50">
                        <MapPin size={12} /> {p.location || '—'} · {clientName(p.clientId)}
                      </p>
                    </div>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs font-bold text-ink/50">
                    <span>Budget used</span>
                    <span>{inr(st.cost)} / {inr(p.budget)} · {st.pctUsed}%</span>
                  </div>
                  <ProgressBar value={st.pctUsed} color={st.pctUsed >= 90 ? '#C2491D' : st.pctUsed >= 70 ? '#E8A20C' : '#0B6B4F'} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-mint/70 px-2.5 py-2 text-center">
                    <div className="text-[10px] font-extrabold tracking-wide text-forest/70 uppercase">Income</div>
                    <div className="text-[13.5px] font-extrabold text-forest">{inr(st.income)}</div>
                  </div>
                  <div className="rounded-xl bg-blush/60 px-2.5 py-2 text-center">
                    <div className="text-[10px] font-extrabold tracking-wide text-clay/70 uppercase">Cost</div>
                    <div className="text-[13.5px] font-extrabold text-clay">{inr(st.cost)}</div>
                  </div>
                  <div className={`rounded-xl px-2.5 py-2 text-center ${st.profit >= 0 ? 'bg-skywash/70' : 'bg-linen'}`}>
                    <div className="text-[10px] font-extrabold tracking-wide uppercase opacity-60">Profit</div>
                    <div className={`text-[13.5px] font-extrabold ${st.profit >= 0 ? 'text-steel' : 'text-clay'}`}>{inr(st.profit)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-ink/45">
                    <CalendarDays size={13} /> {fmtDate(p.startDate)} → {p.endDate ? fmtDate(p.endDate) : '—'} · {p.progress}% done
                  </span>
                  <RowActions onEdit={() => openEdit(p)} onDelete={() => setDel(p)} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id === 'new' || !projects.some((p) => p.id === editing?.id) ? 'New project' : 'Edit project'} subtitle="Sites are the centre of all costing.">
        <div className="grid gap-3.5">
          <Field label="Project name"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sharma Residence" className={inputCls()} /></Field>
          <FormGrid>
            <Field label="Client"><select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputCls()}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Location"><input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="Dahegam" className={inputCls()} /></Field>
            <Field label="Budget (₹)"><input value={form.budget || ''} onChange={(e) => set('budget', Number(e.target.value))} placeholder="850000" type="number" min={0} className={inputCls()} /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)} className={inputCls()}>{['Planning', 'Active', 'On Hold', 'Completed'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Start date"><input value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} type="date" className={inputCls()} /></Field>
            <Field label="Expected end"><input value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} type="date" className={inputCls()} /></Field>
            <Field label="Progress %" hint={`${form.progress}%`}><input value={form.progress} onChange={(e) => set('progress', Number(e.target.value))} type="range" min={0} max={100} className="w-full accent-[#9A6200]" /></Field>
            <Field label="Description"><input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="G+1 bungalow…" className={inputCls()} /></Field>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={save}>Save Project</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete project?" confirmLabel="Yes, Delete"
        message={`Are you sure you want to delete "${del?.name}"? Linked records stay, but the project will be removed.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteProject(del.id); toast.success('Project deleted', del.name); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ CLIENTS ═══════════════
const blankClient = (): Client => ({
  id: uid('c'), name: '', phone: '', email: '', address: '', gst: '', type: 'Individual', createdAt: new Date().toISOString(),
});

export function ClientsPage() {
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);
  const income = useApp((s) => s.income);
  const upsertClient = useApp((s) => s.upsertClient);
  const deleteClient = useApp((s) => s.deleteClient);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Client>(blankClient());
  const [del, setDel] = useState<Client | null>(null);
  const set = (k: keyof Client, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return clients.filter((c) => !needle || c.name.toLowerCase().includes(needle) || (c.phone ?? '').includes(needle));
  }, [clients, q]);

  const billed = (id: string) => income.filter((i) => i.clientId === id).reduce((x, i) => x + num(i.amount), 0);

  const save = () => {
    if (form.name.trim().length < 3) return toast.error('Client name is too short');
    upsertClient({ ...form, name: form.name.trim() });
    setEditing(null);
    toast.success('Client saved', form.name.trim());
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Clients" subtitle={`${clients.length} parties · individuals, companies and government.`}
        actions={<Btn onClick={() => { setForm(blankClient()); setEditing(blankClient()); }}><Plus size={17} /> New Client</Btn>}
      />
      <div className="mb-4"><SearchInput placeholder="Search clients or phone…" onSearch={setQ} className="sm:max-w-xs" /></div>

      {rows.length === 0 ? (
        <EmptyState icon={<Briefcase size={30} />} title="No clients found" hint="Add your first client party to link projects and income." action="New Client" onAction={() => { setForm(blankClient()); setEditing(blankClient()); }} />
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <motion.div key={c.id} variants={staggerChild} whileHover={{ y: -4 }} className="card-paper tap-lift rounded-3xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div>
                    <h3 className="font-display text-[16px] leading-tight font-bold">{c.name}</h3>
                    <p className="mt-0.5 text-xs font-bold text-ink/50">{c.type}</p>
                  </div>
                </div>
                <RowActions onEdit={() => { setForm({ ...c }); setEditing(c); }} onDelete={() => setDel(c)} />
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] font-semibold text-ink/65">
                {c.phone && <p className="flex items-center gap-2"><Phone size={13} className="text-ink/35" /> {c.phone}</p>}
                {c.address && <p className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0 text-ink/35" /> {c.address}</p>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/70 pt-3 text-center">
                <div className="rounded-xl bg-cream/70 px-2 py-2">
                  <div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Projects</div>
                  <div className="text-sm font-extrabold">{projects.filter((p) => p.clientId === c.id).length}</div>
                </div>
                <div className="rounded-xl bg-mint/70 px-2 py-2">
                  <div className="text-[10px] font-extrabold tracking-wide text-forest/70 uppercase">Received</div>
                  <div className="text-sm font-extrabold text-forest">{inr(billed(c.id))}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Client details" subtitle="This party appears on estimates and receipts.">
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Full name"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Sharma" className={inputCls()} /></Field>
            <Field label="Type"><select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls()}>{['Individual', 'Company', 'Government'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Phone"><input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" className={inputCls()} /></Field>
            <Field label="Email"><input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="name@mail.com" className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Street, area, city…" className={inputCls()} /></Field></div>
            <div className="sm:col-span-2"><Field label="GST number" hint="Optional"><input value={form.gst ?? ''} onChange={(e) => set('gst', e.target.value)} placeholder="24XXXXX0000X1Z5" className={inputCls()} /></Field></div>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={save}>Save Client</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete client?" confirmLabel="Yes, Delete"
        message={`Are you sure you want to delete "${del?.name}"? Their projects and income records will stay but become unlinked.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteClient(del.id); toast.success('Client deleted', del.name); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ WORKERS ═══════════════
const blankWorker = (): Worker => ({
  id: uid('w'), name: '', phone: '', skill: 'Helper', address: '', aadhaar: '',
  rate: 450, active: true, bankAccount: '', ifsc: '', emergencyContact: '', createdAt: new Date().toISOString(),
});

const skillHints = ['Mason', 'Helper', 'Painter', 'Steel Fixer', 'Carpenter', 'Plumber', 'Electrician', 'Welder', 'Driver', 'Supervisor'];

export function WorkersPage() {
  const workers = useApp((s) => s.workers);
  const upsertWorker = useApp((s) => s.upsertWorker);
  const deleteWorker = useApp((s) => s.deleteWorker);
  const st = useApp((s) => s);
  const summaryOf = (id: string) => workerMonthSummary(st, id, currentMonthKey());
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<Worker>(blankWorker());
  const [del, setDel] = useState<Worker | null>(null);
  const set = (k: keyof Worker, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return workers.filter((w) =>
      (filter === 'All' || (filter === 'Active' ? w.active : !w.active)) &&
      (!needle || w.name.toLowerCase().includes(needle) || w.skill.toLowerCase().includes(needle)),
    );
  }, [workers, q, filter]);

  const save = () => {
    if (form.name.trim().length < 3) return toast.error('Worker name is too short');
    if (num(form.rate) <= 0) return toast.error('Daily rate must be greater than zero');
    upsertWorker({ ...form, name: form.name.trim(), rate: num(form.rate) });
    setEditing(null);
    toast.success('Worker saved', form.name.trim());
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Workers" subtitle={`${workers.filter((w) => w.active).length} active · daily rates, advances and earnings.`}
        actions={<Btn onClick={() => { setForm(blankWorker()); setEditing(blankWorker()); }}><Plus size={17} /> New Worker</Btn>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search workers or skills…" onSearch={setQ} className="sm:max-w-xs" />
        <FilterChips value={filter} onChange={setFilter} options={[{ value: 'All', label: 'All' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<HardHat size={30} />} title="No workers found" hint="Register your first worker with skill and daily rate." action="New Worker" onAction={() => { setForm(blankWorker()); setEditing(blankWorker()); }} />
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((w) => {
            const ms = summaryOf(w.id);
            return (
              <motion.div key={w.id} variants={staggerChild} whileHover={{ y: -4 }} className={`card-paper tap-lift rounded-3xl p-5 ${!w.active ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={w.name} size="lg" photo={w.photoUrl} />
                    <div>
                      <h3 className="font-display text-[16px] leading-tight font-bold">{w.name}</h3>
                      <p className="mt-0.5 text-xs font-bold text-ink/50">{w.skill} · {inr(w.rate)}/day</p>
                      <p className="mt-1"><Badge>{w.active ? 'Active' : 'Inactive'}</Badge></p>
                    </div>
                  </div>
                  <RowActions onEdit={() => { setForm({ ...w }); setEditing(w); }} onDelete={() => setDel(w)} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 pt-3 text-center">
                  <div className="rounded-xl bg-cream/70 px-1 py-2">
                    <div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Days</div>
                    <div className="text-sm font-extrabold">{ms.days}</div>
                  </div>
                  <div className="rounded-xl bg-cream/70 px-1 py-2">
                    <div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Advance</div>
                    <div className="text-sm font-extrabold text-clay">{inr(ms.advance)}</div>
                  </div>
                  <div className="rounded-xl bg-mint/70 px-1 py-2">
                    <div className="text-[10px] font-extrabold tracking-wide text-forest/70 uppercase">Net</div>
                    <div className="text-sm font-extrabold text-forest">{inr(ms.net)}</div>
                  </div>
                </div>
                {w.phone && <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-ink/45"><Phone size={12} /> {w.phone}</p>}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Worker details" subtitle="Rates drive the auto salary calculation." wide>
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Full name"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Kumar" className={inputCls()} /></Field>
            <Field label="Skill">
              <input value={form.skill} onChange={(e) => set('skill', e.target.value)} list="skills" placeholder="Mason" className={inputCls()} />
              <datalist id="skills">{skillHints.map((sk) => <option key={sk} value={sk} />)}</datalist>
            </Field>
            <Field label="Daily rate (₹)"><input value={form.rate || ''} onChange={(e) => set('rate', Number(e.target.value))} type="number" min={0} className={inputCls()} /></Field>
            <Field label="Phone"><input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" className={inputCls()} /></Field>
            <Field label="Aadhaar (stored masked)"><input value={form.aadhaar ?? ''} onChange={(e) => set('aadhaar', e.target.value)} placeholder="XXXX-XXXX-1234" className={inputCls()} /></Field>
            <Field label="Emergency contact"><input value={form.emergencyContact ?? ''} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="+91 …" className={inputCls()} /></Field>
            <Field label="Bank account"><input value={form.bankAccount ?? ''} onChange={(e) => set('bankAccount', e.target.value)} className={inputCls()} /></Field>
            <Field label="IFSC"><input value={form.ifsc ?? ''} onChange={(e) => set('ifsc', e.target.value)} className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Village / town" className={inputCls()} /></Field></div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-ink/70">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4.5 w-4.5 accent-[#9A6200]" />
              Active worker
            </label>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={save}>Save Worker</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Remove worker?" confirmLabel="Yes, Remove"
        message={`Are you sure you want to remove "${del?.name}"? Their attendance history will also be deleted.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteWorker(del.id); toast.success('Worker removed', del.name); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

export function TeamNote() {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-ink/45">
      <Users size={14} /> Worker logins see only their own records.
    </div>
  );
}
