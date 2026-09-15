// ─── Admin · Income, Expenses, Estimates ───
import { motion } from 'framer-motion';
import {
  Banknote, FileText, Plus, Printer, Receipt, Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Fab, PageWrapper } from '../../components/layout';
import {
  Badge, Btn, ConfirmDialog, EmptyState, Field, inputCls,
  Modal, PageHeader, SearchInput,
} from '../../components/ui';
import { fmtDate, inr, num, todayISO, uid } from '../../lib/format';
import { printEstimate } from '../../lib/pdf';
import type {
  Estimate, EstimateItem, EstimateStatus, Expense, ExpenseCategory,
  Income, IncomeMode,
} from '../../types';
import { toast, useApp } from '../../store/appStore';
import { DataTable, FilterChips, FormGrid, MoneyCell, RowActions, useAutoNew } from './Crud';

// ═══════════════ INCOME ═══════════════
const incomeModes: IncomeMode[] = ['Cash', 'Cheque', 'NEFT', 'UPI', 'RTGS', 'Online'];

const blankIncome = (clientId: string, projectId: string): Income => ({
  id: uid('i'), date: todayISO(), clientId, projectId, work: '', amount: 0,
  mode: 'UPI', reference: '', note: '', createdAt: new Date().toISOString(),
});

export function IncomePage() {
  const income = useApp((s) => s.income);
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);
  const upsertIncome = useApp((s) => s.upsertIncome);
  const deleteIncome = useApp((s) => s.deleteIncome);
  const autoNew = useAutoNew();
  const [q, setQ] = useState('');
  const [project, setProject] = useState('All');
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState<Income>(() => blankIncome(clients[0]?.id ?? '', projects[0]?.id ?? ''));
  const [del, setDel] = useState<Income | null>(null);
  const set = (k: keyof Income, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blankIncome(clients[0]?.id ?? '', projects[0]?.id ?? '')); setEditing(blankIncome('x', 'x')); };
  useEffect(() => { if (autoNew) openNew(); /* eslint-disable-next-line */ }, [autoNew]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...income]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((i) =>
        (project === 'All' || i.projectId === project) &&
        (!needle || (i.work ?? '').toLowerCase().includes(needle) || (i.reference ?? '').toLowerCase().includes(needle)),
      );
  }, [income, q, project]);

  const total = rows.reduce((x, i) => x + num(i.amount), 0);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—';
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  const save = () => {
    if (num(form.amount) <= 0) return toast.error('Amount must be greater than zero');
    if (!form.clientId || !form.projectId) return toast.error('Client and project are required');
    upsertIncome({ ...form, amount: num(form.amount) });
    setEditing(null);
    toast.success('Income recorded', `${inr(form.amount)} from ${clientName(form.clientId)}`);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Income" subtitle={`${inr(total)} received · every client payment in one ledger.`}
        actions={<Btn onClick={openNew}><Plus size={17} /> Add Income</Btn>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search work or reference…" onSearch={setQ} className="sm:max-w-xs" />
        <select value={project} onChange={(e) => setProject(e.target.value)} className={`${inputCls()} sm:max-w-[220px]`}>
          <option value="All">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {incomeModes.slice(0, 4).map((m) => {
          const v = rows.filter((i) => i.mode === m).reduce((x, i) => x + num(i.amount), 0);
          return (
            <div key={m} className="card-paper rounded-2xl px-4 py-3">
              <div className="text-[10.5px] font-extrabold tracking-widest text-ink/45 uppercase">{m}</div>
              <div className="text-[15px] font-extrabold text-forest">{inr(v)}</div>
            </div>
          );
        })}
      </div>

      <DataTable<Income>
        rows={rows}
        columns={[
          { header: 'Date', render: (i) => fmtDate(i.date) },
          { header: 'Client', render: (i) => <span className="font-extrabold">{clientName(i.clientId)}</span> },
          { header: 'Project', render: (i) => <span className="text-ink/60">{projectName(i.projectId)}</span> },
          { header: 'Work', render: (i) => <span className="text-ink/60">{i.work || '—'}</span> },
          { header: 'Mode', render: (i) => <Badge tone="bg-tealwash text-tealpop">{i.mode}</Badge> },
          { header: 'Reference', render: (i) => <span className="font-mono text-xs text-ink/50">{i.reference || '—'}</span> },
          { header: 'Amount', render: (i) => <MoneyCell value={`+${inr(i.amount)}`} positive /> },
          { header: '', className: 'text-right', render: (i) => <RowActions onEdit={() => { setForm({ ...i }); setEditing(i); }} onDelete={() => setDel(i)} /> },
        ]}
        empty={<EmptyState icon={<Banknote size={30} />} title="No income yet" hint="Record client advances and stage payments as they arrive." action="Add Income" onAction={openNew} />}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Record income" subtitle="Receipts update project profit instantly.">
        <div className="grid gap-3.5">
          <FormGrid>
            <Field label="Date"><input type="date" value={form.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} className={inputCls()} /></Field>
            <Field label="Amount (₹)"><input type="number" min={0} value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} placeholder="50000" className={inputCls()} /></Field>
            <Field label="Client"><select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputCls()}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Project"><select value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Payment mode"><select value={form.mode} onChange={(e) => set('mode', e.target.value)} className={inputCls()}>{incomeModes.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Reference" hint="Optional"><input value={form.reference ?? ''} onChange={(e) => set('reference', e.target.value)} placeholder="UPI/NEFT ref" className={inputCls()} /></Field>
            <div className="sm:col-span-2"><Field label="Work / stage"><input value={form.work ?? ''} onChange={(e) => set('work', e.target.value)} placeholder="Slab stage payment" className={inputCls()} /></Field></div>
            <div className="sm:col-span-2"><Field label="Note" hint="Optional"><input value={form.note ?? ''} onChange={(e) => set('note', e.target.value)} className={inputCls()} /></Field></div>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn variant="success" className="flex-1" onClick={save}>Save Income</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete income?" confirmLabel="Yes, Delete"
        message={`Delete the ${inr(del?.amount ?? 0)} receipt from ${clientName(del?.clientId ?? '')} on ${fmtDate(del?.date)}? Profit will be recalculated.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteIncome(del.id); toast.success('Income deleted'); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ EXPENSES ═══════════════
const categories: ExpenseCategory[] = ['Fuel', 'Overhead', 'Equipment', 'Transport', 'Labour', 'Food', 'Safety', 'Tax', 'Miscellaneous'];

const blankExpense = (projectId: string): Expense => ({
  id: uid('e'), date: todayISO(), description: '', category: 'Miscellaneous',
  projectId, amount: 0, mode: 'Cash', createdAt: new Date().toISOString(),
});

export function ExpensesPage() {
  const expenses = useApp((s) => s.expenses);
  const projects = useApp((s) => s.projects);
  const upsertExpense = useApp((s) => s.upsertExpense);
  const deleteExpense = useApp((s) => s.deleteExpense);
  const autoNew = useAutoNew();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'All' | ExpenseCategory>('All');
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<Expense>(() => blankExpense(projects[0]?.id ?? ''));
  const [del, setDel] = useState<Expense | null>(null);
  const set = (k: keyof Expense, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blankExpense(projects[0]?.id ?? '')); setEditing(blankExpense('x')); };
  useEffect(() => { if (autoNew) openNew(); /* eslint-disable-next-line */ }, [autoNew]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((e) =>
        (cat === 'All' || e.category === cat) &&
        (!needle || e.description.toLowerCase().includes(needle)),
      );
  }, [expenses, q, cat]);

  const total = rows.reduce((x, e) => x + num(e.amount), 0);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  const save = () => {
    if (form.description.trim().length < 3) return toast.error('Please describe the expense');
    if (num(form.amount) <= 0) return toast.error('Amount must be greater than zero');
    if (!form.projectId) return toast.error('Please select a project');
    upsertExpense({ ...form, description: form.description.trim(), amount: num(form.amount) });
    setEditing(null);
    toast.success('Expense saved', `${inr(form.amount)} · ${form.category}`);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Expenses" subtitle={`${inr(total)} spent · fuel, transport, equipment and overheads.`}
        actions={<Btn onClick={openNew}><Plus size={17} /> Add Expense</Btn>}
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchInput placeholder="Search expenses…" onSearch={setQ} className="sm:max-w-xs" />
        <FilterChips
          value={cat} onChange={setCat}
          options={[{ value: 'All', label: 'All' }, ...categories.map((c) => ({ value: c as 'All' | ExpenseCategory, label: c }))]}
        />
      </div>

      <DataTable<Expense>
        rows={rows}
        columns={[
          { header: 'Date', render: (e) => fmtDate(e.date) },
          { header: 'Description', render: (e) => <span className="font-extrabold">{e.description}</span> },
          { header: 'Category', render: (e) => <Badge tone="bg-plumwash text-plum">{e.category}</Badge> },
          { header: 'Project', render: (e) => <span className="text-ink/60">{projectName(e.projectId)}</span> },
          { header: 'Mode', render: (e) => e.mode },
          { header: 'Amount', render: (e) => <MoneyCell value={`−${inr(e.amount)}`} /> },
          { header: '', className: 'text-right', render: (e) => <RowActions onEdit={() => { setForm({ ...e }); setEditing(e); }} onDelete={() => setDel(e)} /> },
        ]}
        empty={<EmptyState icon={<Receipt size={30} />} title="No expenses yet" hint="Track every rupee that leaves — diesel to safety gear." action="Add Expense" onAction={openNew} />}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Add expense" subtitle="Site and office spending in one place.">
        <div className="grid gap-3.5">
          <FormGrid>
            <div className="sm:col-span-2"><Field label="Description"><input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Diesel for mixer" className={inputCls()} /></Field></div>
            <Field label="Category"><select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls()}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Project"><select value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Amount (₹)"><input type="number" min={0} value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} className={inputCls()} /></Field>
            <Field label="Date"><input type="date" value={form.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} className={inputCls()} /></Field>
            <Field label="Mode"><select value={form.mode} onChange={(e) => set('mode', e.target.value)} className={inputCls()}>{['Cash', 'UPI', 'Online', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          </FormGrid>
          <div className="flex gap-2.5">
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn className="flex-1" onClick={save}>Save Expense</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete expense?" confirmLabel="Yes, Delete"
        message={`Delete "${del?.description}" (${inr(del?.amount ?? 0)})? Project cost will be recalculated.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteExpense(del.id); toast.success('Expense deleted'); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}

// ═══════════════ ESTIMATES ═══════════════
const blankItem = (): EstimateItem => ({ name: '', qty: 1, unit: 'Sq.ft', rate: 0, amount: 0 });

export function EstimatesPage() {
  const estimates = useApp((s) => s.estimates);
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);
  const settings = useApp((s) => s.settings);
  const upsertEstimate = useApp((s) => s.upsertEstimate);
  const deleteEstimate = useApp((s) => s.deleteEstimate);
  const nextEstimateNo = useApp((s) => s.nextEstimateNo);
  const autoNew = useAutoNew();
  const [status, setStatus] = useState<'All' | EstimateStatus>('All');
  const [editing, setEditing] = useState<Estimate | null>(null);
  const [form, setForm] = useState<Estimate | null>(null);
  const [view, setView] = useState<Estimate | null>(null);
  const [del, setDel] = useState<Estimate | null>(null);

  const newEstimate = (): Estimate => ({
    id: uid('es'), estimateNo: nextEstimateNo(),
    clientId: clients[0]?.id ?? '', projectId: projects[0]?.id ?? '', title: '',
    items: [blankItem()], subtotal: 0, gstPercent: 18, gstAmount: 0, total: 0,
    status: 'Draft', validUntil: '', note: '', createdAt: new Date().toISOString(),
  });

  const openNew = () => { const e = newEstimate(); setForm(e); setEditing(e); };
  useEffect(() => { if (autoNew) openNew(); /* eslint-disable-next-line */ }, [autoNew]);

  const recalc = (e: Estimate): Estimate => {
    const items = e.items.map((it) => ({ ...it, amount: num(it.qty) * num(it.rate) }));
    const subtotal = items.reduce((x, it) => x + it.amount, 0);
    const gstAmount = Math.round(subtotal * (num(e.gstPercent) / 100));
    return { ...e, items, subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const setF = <K extends keyof Estimate>(k: K, v: Estimate[K]) =>
    setForm((f) => (f ? recalc({ ...f, [k]: v }) : f));

  const setItem = (idx: number, k: keyof EstimateItem, v: string | number) =>
    setForm((f) => {
      if (!f) return f;
      const items = f.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it));
      return recalc({ ...f, items });
    });

  const rows = useMemo(
    () => [...estimates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((e) => status === 'All' || e.status === status),
    [estimates, status],
  );

  const save = () => {
    if (!form) return;
    if (!form.clientId) return toast.error('Please select a client');
    if (form.items.some((it) => it.name.trim().length < 2)) return toast.error('Every item needs a work description');
    if (form.total <= 0) return toast.error('Estimate total must be greater than zero');
    upsertEstimate({ ...form, title: form.title.trim() || 'Work Estimate' });
    setEditing(null);
    setForm(null);
    toast.success('Estimate saved', form.estimateNo);
  };

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—';
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';
  const doPrint = (e: Estimate) => {
    const c = clients.find((x) => x.id === e.clientId);
    if (!c) return toast.error('Client record missing');
    printEstimate(settings, e, c, projects.find((x) => x.id === e.projectId));
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Estimates" subtitle="Professional GST quotations clients can approve."
        actions={<Btn onClick={openNew}><Plus size={17} /> New Estimate</Btn>}
      />
      <div className="mb-4">
        <FilterChips
          value={status} onChange={setStatus}
          options={[{ value: 'All', label: 'All' }, { value: 'Draft', label: 'Draft' }, { value: 'Sent', label: 'Sent' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<FileText size={30} />} title="No estimates yet" hint="Build itemised quotations with GST and share them as PDF." action="New Estimate" onAction={openNew} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="card-paper tap-lift rounded-3xl p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs font-extrabold text-golddeep">{e.estimateNo}</div>
                  <h3 className="font-display mt-1 text-[17px] leading-tight font-bold">{e.title}</h3>
                  <p className="mt-0.5 text-xs font-bold text-ink/50">{clientName(e.clientId)} · {projectName(e.projectId)}</p>
                </div>
                <Badge>{e.status}</Badge>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3">
                {e.items.slice(0, 3).map((it, j) => (
                  <div key={j} className="flex justify-between text-[12.5px] font-semibold text-ink/60">
                    <span className="truncate">{it.name} <span className="text-ink/35">× {it.qty} {it.unit}</span></span>
                    <span className="shrink-0 font-extrabold text-ink/80">{inr(it.amount)}</span>
                  </div>
                ))}
                {e.items.length > 3 && <div className="text-[11.5px] font-bold text-ink/40">+{e.items.length - 3} more items</div>}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-night px-4 py-2.5 text-white">
                <span className="text-[11px] font-extrabold tracking-widest text-gold uppercase">Total + GST</span>
                <span className="font-display text-lg font-bold">{inr(e.total)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={e.status}
                  onChange={(ev) => { upsertEstimate({ ...e, status: ev.target.value as EstimateStatus }); toast.success('Status updated', `${e.estimateNo} → ${ev.target.value}`); }}
                  className="field max-w-[130px] flex-1 cursor-pointer py-2 text-[12.5px] font-extrabold"
                >
                  {(['Draft', 'Sent', 'Approved', 'Rejected'] as EstimateStatus[]).map((st) => <option key={st}>{st}</option>)}
                </select>
                <Btn small variant="outline" onClick={() => setView(e)}>View</Btn>
                <Btn small variant="outline" onClick={() => doPrint(e)}><Printer size={14} /> PDF</Btn>
                <Btn small variant="outline" onClick={() => { setForm({ ...e, items: e.items.map((it) => ({ ...it })) }); setEditing(e); }}>Edit</Btn>
                <Btn small variant="outline" className="text-clay!" onClick={() => setDel(e)}>Delete</Btn>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* builder */}
      <Modal open={!!editing && !!form} onClose={() => { setEditing(null); setForm(null); }} title={form?.estimateNo ?? 'Estimate'} subtitle="Itemised scope with automatic GST math." wide>
        {form && (
          <div className="grid gap-3.5">
            <FormGrid>
              <Field label="Client"><select value={form.clientId} onChange={(e) => setF('clientId', e.target.value)} className={inputCls()}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Project"><select value={form.projectId} onChange={(e) => setF('projectId', e.target.value)} className={inputCls()}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <div className="sm:col-span-2"><Field label="Estimate title"><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="Ground floor extension — 400 sq.ft." className={inputCls()} /></Field></div>
            </FormGrid>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-ink/70">Work items</span>
                <button onClick={() => setForm((f) => (f ? recalc({ ...f, items: [...f.items, blankItem()] }) : f))} className="cursor-pointer text-[12.5px] font-extrabold text-golddeep hover:underline">
                  + Add row
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_64px_76px_90px_28px] items-center gap-1.5 sm:grid-cols-[1fr_70px_84px_100px_90px_28px]">
                    <input value={it.name} onChange={(e) => setItem(idx, 'name', e.target.value)} placeholder="Work description" className={inputCls('text-[13px]! px-2.5!')} />
                    <input value={it.qty || ''} onChange={(e) => setItem(idx, 'qty', Number(e.target.value))} type="number" min={0} placeholder="Qty" className={inputCls('text-[13px]! px-2! text-center')} />
                    <select value={it.unit} onChange={(e) => setItem(idx, 'unit', e.target.value)} className={inputCls('text-[13px]! px-2!')}>
                      {['Sq.ft', 'Nos', 'Kg', 'Bags', 'Meter', 'Brass', 'Lot', 'Hours'].map((u) => <option key={u}>{u}</option>)}
                    </select>
                    <input value={it.rate || ''} onChange={(e) => setItem(idx, 'rate', Number(e.target.value))} type="number" min={0} placeholder="Rate" className={inputCls('text-[13px]! px-2! text-right')} />
                    <div className="hidden text-right text-[13px] font-extrabold sm:block">{inr(num(it.qty) * num(it.rate))}</div>
                    <button
                      onClick={() => form.items.length > 1 && setForm((f) => (f ? recalc({ ...f, items: f.items.filter((_, j) => j !== idx) }) : f))}
                      className="grid h-8 w-7 cursor-pointer place-items-center rounded-lg text-clay/60 transition hover:bg-blush hover:text-clay"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-cream/70 p-4 sm:grid-cols-3">
              <Field label="GST %"><input type="number" min={0} max={28} value={form.gstPercent} onChange={(e) => setF('gstPercent', Number(e.target.value))} className={inputCls()} /></Field>
              <Field label="Valid until"><input type="date" value={form.validUntil ?? ''} onChange={(e) => setF('validUntil', e.target.value)} className={inputCls()} /></Field>
              <Field label="Status"><select value={form.status} onChange={(e) => setF('status', e.target.value as EstimateStatus)} className={inputCls()}>{(['Draft', 'Sent', 'Approved', 'Rejected'] as EstimateStatus[]).map((st) => <option key={st}>{st}</option>)}</select></Field>
            </div>
            <Field label="Note" hint="Optional"><input value={form.note ?? ''} onChange={(e) => setF('note', e.target.value)} placeholder="Payment in 3 stages…" className={inputCls()} /></Field>

            <div className="space-y-1.5 rounded-2xl bg-night p-4 text-white">
              <div className="flex justify-between text-[13px] font-bold text-white/60"><span>Subtotal</span><span>{inr(form.subtotal)}</span></div>
              <div className="flex justify-between text-[13px] font-bold text-white/60"><span>GST @ {form.gstPercent}%</span><span>{inr(form.gstAmount)}</span></div>
              <div className="flex justify-between border-t border-white/15 pt-2"><span className="text-xs font-extrabold tracking-widest text-gold uppercase">Grand total</span><span className="font-display text-xl font-bold">{inr(form.total)}</span></div>
            </div>

            <div className="flex gap-2.5">
              <Btn variant="outline" className="flex-1" onClick={() => { setEditing(null); setForm(null); }}>Cancel</Btn>
              <Btn className="flex-1" onClick={save}>Save Estimate</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* view */}
      <Modal open={!!view} onClose={() => setView(null)} title={view?.estimateNo ?? ''} subtitle={view ? `${clientName(view.clientId)} · ${fmtDate(view.createdAt)}` : ''} wide>
        {view && (
          <div>
            <h4 className="font-display text-lg font-bold">{view.title}</h4>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-[13px]">
                <thead><tr className="bg-cream/70 text-[11px] tracking-wide text-ink/50 uppercase">
                  <th className="px-3 py-2.5 font-extrabold">Work</th><th className="px-3 py-2.5 text-center font-extrabold">Qty</th><th className="px-3 py-2.5 text-right font-extrabold">Rate</th><th className="px-3 py-2.5 text-right font-extrabold">Amount</th>
                </tr></thead>
                <tbody>
                  {view.items.map((it, i) => (
                    <tr key={i} className="border-t border-line/60">
                      <td className="px-3 py-2.5 font-bold">{it.name}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-ink/60">{it.qty} {it.unit}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{inr(it.rate)}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold">{inr(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 rounded-2xl bg-cream/70 p-4 text-[13.5px] font-bold">
              <div className="flex justify-between text-ink/60"><span>Subtotal</span><span>{inr(view.subtotal)}</span></div>
              <div className="flex justify-between text-ink/60"><span>GST @ {view.gstPercent}%</span><span>{inr(view.gstAmount)}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-extrabold"><span>Total</span><span>{inr(view.total)}</span></div>
            </div>
            <div className="mt-4 flex gap-2.5">
              <Btn variant="dark" className="flex-1" onClick={() => doPrint(view)}><Printer size={16} /> Download PDF</Btn>
              <Btn variant="outline" className="flex-1" onClick={() => setView(null)}>Close</Btn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del} title="Delete estimate?" confirmLabel="Yes, Delete"
        message={`Delete estimate ${del?.estimateNo} (${inr(del?.total ?? 0)})? This cannot be undone.`}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteEstimate(del.id); toast.success('Estimate deleted'); } setDel(null); }}
      />
      <Fab />
    </PageWrapper>
  );
}
