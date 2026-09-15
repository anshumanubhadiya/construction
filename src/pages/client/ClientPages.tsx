// ─── Client portal · projects, estimates, payments, profile ───
import { motion } from 'framer-motion';
import {
  BadgeCheck, Building2, CalendarDays, FileText, MapPin,
  Printer, Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import {
  AnimatedCounter, Avatar, Badge, Btn, EmptyState, Field, inputCls,
  Modal, PageHeader, ProgressBar, staggerChild, staggerParent,
} from '../../components/ui';
import { DataTable, MoneyCell } from '../admin/Crud';
import { fmtDate, inr, num } from '../../lib/format';
import { printEstimate } from '../../lib/pdf';
import type { Estimate } from '../../types';
import { projectStats, sessionProfile, toast, useApp } from '../../store/appStore';

function useClient() {
  const me = useApp(sessionProfile);
  const client = useApp((s) => s.clients.find((c) => c.id === me?.linkedId));
  return { me, client };
}

// ───────── DASHBOARD ─────────
export function ClientDashboard() {
  const { me, client } = useClient();
  const projectsAll = useApp((s) => s.projects);
  const projects = useMemo(() => projectsAll.filter((p) => p.clientId === client?.id), [projectsAll]);
  const estimatesAll = useApp((s) => s.estimates);
  const estimates = useMemo(() => estimatesAll.filter((e) => e.clientId === client?.id), [estimatesAll]);
  const incomeAll = useApp((s) => s.income);
  const income = useMemo(() => incomeAll.filter((i) => i.clientId === client?.id), [incomeAll]);
  const st = useApp((s) => s);
  const statsOf = (id: string) => projectStats(st, id);

  const billed = estimates.filter((e) => e.status === 'Approved' || e.status === 'Sent').reduce((x, e) => x + num(e.total), 0);
  const paid = income.reduce((x, i) => x + num(i.amount), 0);

  const cards = [
    { label: 'My Projects', value: projects.length, format: (n: number) => String(Math.round(n)), icon: <Building2 size={20} />, bg: 'bg-skywash', fg: 'text-steel' },
    { label: 'Total Billed', value: billed, format: inr, icon: <FileText size={20} />, bg: 'bg-amberwash', fg: 'text-golddeep' },
    { label: 'Total Paid', value: paid, format: inr, icon: <Wallet size={20} />, bg: 'bg-mint', fg: 'text-forest' },
    { label: 'Balance', value: Math.max(0, billed - paid), format: inr, icon: <BadgeCheck size={20} />, bg: 'bg-plumwash', fg: 'text-plum' },
  ];

  return (
    <PageWrapper>
      <PageHeader title={`Welcome, ${me?.name.split(' ')[0] ?? 'Client'}!`} subtitle="Your projects, estimates and payments — always up to date." />

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={staggerChild} whileHover={{ y: -4 }} className="card-paper tap-lift rounded-3xl p-4 sm:p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.fg}`}>{c.icon}</div>
            <div className="mt-3 text-[11px] font-extrabold tracking-wide text-ink/50 uppercase">{c.label}</div>
            <div className="font-display mt-0.5 text-[22px] font-bold"><AnimatedCounter value={c.value} format={c.format} /></div>
          </motion.div>
        ))}
      </motion.div>

      <h3 className="font-display mt-7 mb-3 text-lg font-bold">My projects</h3>
      {projects.length === 0 ? (
        <EmptyState icon={<Building2 size={30} />} title="No projects yet" hint="Your contractor will link your projects here once work begins." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p, i) => {
            const st = statsOf(p.id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="card-paper rounded-3xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display text-[17px] font-bold">{p.name}</h4>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-ink/50"><MapPin size={12} /> {p.location}</p>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs font-bold text-ink/50">
                    <span>Work progress</span><span>{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color="#2563eb" />
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between text-xs font-bold text-ink/50">
                    <span>Budget used</span><span>{st.pctUsed}%</span>
                  </div>
                  <ProgressBar value={st.pctUsed} color={st.pctUsed >= 90 ? '#C2491D' : '#E8A20C'} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-xs font-bold text-ink/50">
                  <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {fmtDate(p.startDate)} → {p.endDate ? fmtDate(p.endDate) : '—'}</span>
                  <span className="text-[13px] font-extrabold text-ink">{inr(p.budget)} budget</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-paper rounded-3xl p-5">
          <h3 className="font-display mb-3 text-lg font-bold">Latest estimates</h3>
          {estimates.length === 0 ? <p className="text-sm font-semibold text-ink/45">No estimates shared yet.</p> : (
            <div className="space-y-2">
              {estimates.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold">{e.title}</div>
                    <div className="font-mono text-[11px] font-bold text-ink/45">{e.estimateNo}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[13.5px] font-extrabold">{inr(e.total)}</span>
                    <Badge>{e.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-paper rounded-3xl p-5">
          <h3 className="font-display mb-3 text-lg font-bold">Recent payments</h3>
          {income.length === 0 ? <p className="text-sm font-semibold text-ink/45">No payments recorded yet.</p> : (
            <div className="space-y-2">
              {[...income].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-2xl bg-mint/50 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold">{i.work || 'Payment'}</div>
                    <div className="text-[11px] font-bold text-ink/45">{fmtDate(i.date)} · {i.mode}</div>
                  </div>
                  <span className="shrink-0 text-[13.5px] font-extrabold text-forest">+{inr(i.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

// ───────── ESTIMATES ─────────
export function ClientEstimates() {
  const { client } = useClient();
  const estimatesAll = useApp((s) => s.estimates);
  const estimates = useMemo(() => estimatesAll.filter((e) => e.clientId === client?.id), [estimatesAll]);
  const projects = useApp((s) => s.projects);
  const settings = useApp((s) => s.settings);
  const upsertEstimate = useApp((s) => s.upsertEstimate);
  const [view, setView] = useState<Estimate | null>(null);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';
  const doPrint = (e: Estimate) => {
    if (!client) return;
    printEstimate(settings, e, client, projects.find((x) => x.id === e.projectId));
  };

  return (
    <PageWrapper>
      <PageHeader title="My Estimates" subtitle="Quotations from your contractor — review, approve, download." />
      {estimates.length === 0 ? (
        <EmptyState icon={<FileText size={30} />} title="No estimates yet" hint="When your contractor prepares a quotation, it will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {estimates.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card-paper rounded-3xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs font-extrabold text-golddeep">{e.estimateNo}</div>
                  <h3 className="font-display mt-1 text-[17px] leading-tight font-bold">{e.title}</h3>
                  <p className="mt-0.5 text-xs font-bold text-ink/50">{projectName(e.projectId)} · valid till {fmtDate(e.validUntil)}</p>
                </div>
                <Badge>{e.status}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-night px-4 py-2.5 text-white">
                <span className="text-[11px] font-extrabold tracking-widest text-gold uppercase">Total + GST</span>
                <span className="font-display text-lg font-bold">{inr(e.total)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Btn small variant="outline" className="flex-1" onClick={() => setView(e)}>View Details</Btn>
                <Btn small variant="outline" className="flex-1" onClick={() => doPrint(e)}><Printer size={14} /> PDF</Btn>
                {e.status === 'Sent' && (
                  <Btn small variant="success" className="flex-1" onClick={() => { upsertEstimate({ ...e, status: 'Approved' }); toast.success('Estimate approved', e.estimateNo); }}>
                    <BadgeCheck size={14} /> Approve
                  </Btn>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.estimateNo ?? ''} subtitle={view?.title} wide>
        {view && (
          <div>
            <div className="overflow-hidden rounded-2xl border border-line">
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
            {view.note && <p className="mt-3 rounded-2xl bg-amberwash/60 p-3.5 text-[13px] font-semibold text-bronze">{view.note}</p>}
            <div className="mt-4 flex gap-2.5">
              <Btn variant="dark" className="flex-1" onClick={() => doPrint(view)}><Printer size={16} /> Download PDF</Btn>
              {view.status === 'Sent' && (
                <Btn variant="success" className="flex-1" onClick={() => { upsertEstimate({ ...view, status: 'Approved' }); setView({ ...view, status: 'Approved' }); toast.success('Estimate approved', view.estimateNo); }}>
                  <BadgeCheck size={16} /> Approve
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}

// ───────── PROJECTS ─────────
export function ClientProjects() {
  const { client } = useClient();
  const projectsAll = useApp((s) => s.projects);
  const projects = useMemo(() => projectsAll.filter((p) => p.clientId === client?.id), [projectsAll]);
  const st = useApp((s) => s);
  const statsOf = (id: string) => projectStats(st, id);

  return (
    <PageWrapper>
      <PageHeader title="My Projects" subtitle="Live progress and budget tracking per site." />
      {projects.length === 0 ? (
        <EmptyState icon={<Building2 size={30} />} title="No projects yet" hint="Your sites will appear here with live progress." />
      ) : (
        <div className="grid gap-4">
          {projects.map((p, i) => {
            const st = statsOf(p.id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-paper rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-bold">{p.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-ink/50"><MapPin size={13} /> {p.location} · {fmtDate(p.startDate)} → {p.endDate ? fmtDate(p.endDate) : '—'}</p>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
                {p.description && <p className="mt-2 text-[13.5px] font-medium text-ink/60">{p.description}</p>}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-ink/50"><span>Work progress</span><span>{p.progress}%</span></div>
                    <ProgressBar value={p.progress} color="#2563eb" />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-ink/50"><span>Budget used</span><span>{inr(st.cost)} of {inr(p.budget)}</span></div>
                    <ProgressBar value={st.pctUsed} color={st.pctUsed >= 90 ? '#C2491D' : '#E8A20C'} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-cream/70 px-2 py-2.5"><div className="text-[10px] font-extrabold tracking-wide text-ink/45 uppercase">Budget</div><div className="text-[14px] font-extrabold">{inr(p.budget)}</div></div>
                  <div className="rounded-xl bg-mint/70 px-2 py-2.5"><div className="text-[10px] font-extrabold tracking-wide text-forest/70 uppercase">Paid</div><div className="text-[14px] font-extrabold text-forest">{inr(st.income)}</div></div>
                  <div className="rounded-xl bg-amberwash/70 px-2 py-2.5"><div className="text-[10px] font-extrabold tracking-wide text-golddeep/80 uppercase">Spent on site</div><div className="text-[14px] font-extrabold">{inr(st.cost)}</div></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}

// ───────── PAYMENTS ─────────
export function ClientPayments() {
  const { client } = useClient();
  const incomeAll = useApp((s) => s.income);
  const income = useMemo(() => incomeAll.filter((i) => i.clientId === client?.id), [incomeAll]);
  const projects = useApp((s) => s.projects);
  const estimatesAll = useApp((s) => s.estimates);
  const estimates = useMemo(() => estimatesAll.filter((e) => e.clientId === client?.id), [estimatesAll]);

  const rows = useMemo(() => [...income].sort((a, b) => b.date.localeCompare(a.date)), [income]);
  const paid = income.reduce((x, i) => x + num(i.amount), 0);
  const billed = estimates.filter((e) => e.status === 'Approved' || e.status === 'Sent').reduce((x, e) => x + num(e.total), 0);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  let running = 0;
  const withBalance = [...rows].reverse().map((r) => { running += num(r.amount); return { ...r, balance: running }; }).reverse();

  return (
    <PageWrapper>
      <PageHeader title="Payments" subtitle="Every rupee you've paid, with running balance." />
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: 'Billed', v: billed, bg: 'bg-amberwash/70', c: 'text-golddeep' },
          { l: 'Paid', v: paid, bg: 'bg-mint/70', c: 'text-forest' },
          { l: 'Balance', v: Math.max(0, billed - paid), bg: 'bg-plumwash/70', c: 'text-plum' },
        ].map((x) => (
          <div key={x.l} className={`card-paper rounded-2xl p-4 ${x.bg}`}>
            <div className="text-[10.5px] font-extrabold tracking-widest uppercase opacity-70">{x.l}</div>
            <div className={`font-display text-lg font-bold sm:text-xl ${x.c}`}>{inr(x.v)}</div>
          </div>
        ))}
      </div>
      <DataTable
        rows={withBalance}
        columns={[
          { header: 'Date', render: (i) => fmtDate(i.date) },
          { header: 'Project', render: (i) => projectName(i.projectId) },
          { header: 'Stage / Work', render: (i) => <span className="font-extrabold">{i.work || 'Payment'}</span> },
          { header: 'Mode', render: (i) => <Badge tone="bg-tealwash text-tealpop">{i.mode}</Badge> },
          { header: 'Reference', render: (i) => <span className="font-mono text-xs text-ink/50">{i.reference || '—'}</span> },
          { header: 'Paid', render: (i) => <MoneyCell value={`+${inr(i.amount)}`} positive /> },
          { header: 'Total paid', render: (i) => <span className="font-extrabold">{inr(i.balance)}</span> },
        ]}
        empty={<EmptyState icon={<Wallet size={30} />} title="No payments yet" hint="Your payment history will build up here automatically." />}
      />
    </PageWrapper>
  );
}

// ───────── PROFILE ─────────
export function ClientProfile() {
  const { me, client } = useClient();
  const upsertClient = useApp((s) => s.upsertClient);
  const saveMyProfile = useApp((s) => s.saveMyProfile);
  const changePasswordCloud = useApp((s) => s.changePassword);
  const [form, setForm] = useState({ name: client?.name ?? '', phone: client?.phone ?? '', address: client?.address ?? '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const save = () => {
    if (!client || !me) return;
    if (form.name.trim().length < 3) return toast.error('Name is too short');
    upsertClient({ ...client, name: form.name.trim(), phone: form.phone, address: form.address });
    void saveMyProfile({ name: form.name.trim(), phone: form.phone });
  };

  const changePw = async () => {
    if (!me) return;
    if (pw.next.length < 8) return toast.error('New password must be at least 8 characters');
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match');
    try {
      await changePasswordCloud(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      toast.error('Password change failed', (err as Error)?.message || '');
    }
  };

  if (!client) return <PageWrapper><EmptyState icon={<BadgeCheck size={30} />} title="Account not linked yet" hint="The admin is linking your login to your client record. Please check back soon." /></PageWrapper>;

  return (
    <PageWrapper>
      <PageHeader title="My Profile" subtitle="Keep your contact details current." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-paper rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={client.name} size="lg" />
            <div>
              <h3 className="font-display text-lg font-bold">{client.name}</h3>
              <p className="text-xs font-bold text-ink/50">{client.type} client · since {fmtDate(client.createdAt)}</p>
            </div>
          </div>
          <div className="grid gap-3.5">
            <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls()} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls()} /></Field>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls()} /></Field>
            <Btn onClick={save}>Save Changes</Btn>
          </div>
        </div>
        <div className="card-paper rounded-3xl p-6">
          <h3 className="font-display mb-4 text-lg font-bold">Change password</h3>
          <div className="grid gap-3.5">
            <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputCls()} /></Field>
            <Field label="New password"><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputCls()} /></Field>
            <Field label="Confirm new password"><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputCls()} /></Field>
            <Btn variant="dark" onClick={changePw}>Update Password</Btn>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
