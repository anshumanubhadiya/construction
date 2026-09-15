// ─── PDF via browser print · styled HTML documents ───
import type { BusinessSettings, Client, Estimate, Project } from '../types';
import { fmtDate, fmtDateLong, inr, todayISO } from './format';

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1b1e27; padding: 40px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E8A20C; padding-bottom: 16px; margin-bottom: 20px; }
    .brand h1 { font-size: 26px; letter-spacing: -0.5px; }
    .brand h1 span { color: #9A6200; }
    .brand p { font-size: 12px; color: #666; margin-top: 4px; max-width: 340px; }
    .meta { text-align: right; font-size: 12px; color: #444; }
    .meta .doc { display: inline-block; background: #14161d; color: #E8A20C; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 8px; margin-bottom: 8px; letter-spacing: 1px; }
    h2.sec { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #9A6200; margin: 26px 0 10px; border-left: 4px solid #E8A20C; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { background: #14161d; color: #fff; text-align: left; padding: 9px 10px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 8px 0 0 0; } th:last-child { border-radius: 0 8px 0 0; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee5d0; }
    tr:nth-child(even) td { background: #faf7f1; }
    .r { text-align: right; } .c { text-align: center; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
    .stat { border: 1.5px solid #e5dcc6; border-radius: 12px; padding: 12px 14px; }
    .stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 700; }
    .stat .v { font-size: 20px; font-weight: 800; margin-top: 4px; }
    .total-band { margin-top: 18px; background: #14161d; color: #fff; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .total-band .v { font-size: 24px; font-weight: 800; }
    .green { color: #0b6b4f; } .red { color: #c2491d; } .gold { color: #E8A20C; }
    .foot { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
    .sign { margin-top: 56px; border-top: 1.5px solid #999; padding-top: 6px; width: 220px; text-align: center; font-weight: 700; }
    .terms { font-size: 11.5px; color: #555; line-height: 1.7; white-space: pre-line; background: #faf7f1; border: 1px solid #e5dcc6; border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
    .wm { position: fixed; top: 42%; left: 50%; transform: translate(-50%,-50%) rotate(-28deg); font-size: 92px; font-weight: 900; color: rgba(20,22,29,0.055); letter-spacing: 6px; pointer-events: none; }
    @media print { body { padding: 0; } }
  </style></head><body>${body}
  <script>setTimeout(function(){ window.print(); }, 600);<\/script></body></html>`);
  w.document.close();
}

const letterhead = (s: BusinessSettings, doc: string, extra = '') => `
  <div class="head">
    <div class="brand"><h1>Sarvotam <span>Construction</span></h1>
      <p>${s.address}<br>Phone: ${s.phone} · ${s.email}${s.gst ? `<br>GSTIN: ${s.gst}` : ''}</p></div>
    <div class="meta"><div class="doc">${doc}</div><br>Date: ${fmtDate(todayISO())}<br>${extra}</div>
  </div>`;

export interface PLRow { project: string; income: number; cost: number; profit: number }

export function printPLSummary(
  s: BusinessSettings,
  t: { income: number; labour: number; material: number; expense: number; vehicle: number; cost: number; net: number },
  rows: PLRow[],
) {
  const body = `${letterhead(s, 'P&L SUMMARY')}
    <div class="grid">
      <div class="stat"><div class="l">Total Income</div><div class="v green">${inr(t.income)}</div></div>
      <div class="stat"><div class="l">Labour Cost</div><div class="v">${inr(t.labour)}</div></div>
      <div class="stat"><div class="l">Material Cost</div><div class="v">${inr(t.material)}</div></div>
      <div class="stat"><div class="l">Other Expenses</div><div class="v">${inr(t.expense)}</div></div>
      <div class="stat"><div class="l">Vehicle Cost</div><div class="v">${inr(t.vehicle)}</div></div>
      <div class="stat"><div class="l">Total Cost</div><div class="v red">${inr(t.cost)}</div></div>
    </div>
    <h2 class="sec">Project-wise Profit & Loss</h2>
    <table><tr><th>Project</th><th class="r">Income</th><th class="r">Cost</th><th class="r">Profit / Loss</th></tr>
    ${rows.map((r) => `<tr><td><b>${r.project}</b></td><td class="r">${inr(r.income)}</td><td class="r">${inr(r.cost)}</td><td class="r"><b class="${r.profit >= 0 ? 'green' : 'red'}">${inr(r.profit)}</b></td></tr>`).join('')}
    </table>
    <div class="total-band"><div><div style="font-size:12px;letter-spacing:2px;color:#E8A20C;font-weight:800">NET ${t.net >= 0 ? 'PROFIT' : 'LOSS'}</div></div><div class="v ${t.net >= 0 ? 'gold' : ''}" style="${t.net < 0 ? 'color:#ff8a7a' : ''}">${inr(t.net)}</div></div>
    <div class="foot"><div>Generated by Sarvotam Construction OS</div><div class="sign">Authorised Signature</div></div>`;
  openPrint('P&L Summary — Sarvotam Construction', body);
}

export interface DetailData {
  incomeRows: { date: string; client: string; work: string; amount: number; mode: string }[];
  materialRows: { date: string; name: string; vendor: string; qty: string; amount: number }[];
  expenseRows: { date: string; description: string; category: string; amount: number }[];
  vehicleRows: { date: string; vehicle: string; work: string; cost: number }[];
  labourTotal: number;
  totals: { income: number; cost: number; net: number };
}

export function printDetailed(s: BusinessSettings, d: DetailData) {
  const tbl = (heads: string[], rows: string) =>
    `<table><tr>${heads.map((h, i) => `<th class="${i > 0 && i === heads.length - 1 ? 'r' : ''}">${h}</th>`).join('')}</tr>${rows}</table>`;
  const body = `${letterhead(s, 'DETAILED REPORT')}
    <h2 class="sec">Income / Receipts</h2>
    ${tbl(['Date', 'Client', 'Work', 'Mode', 'Amount'], d.incomeRows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${r.client}</td><td>${r.work}</td><td>${r.mode}</td><td class="r"><b>${inr(r.amount)}</b></td></tr>`).join('') || '<tr><td colspan="5" class="c">No records</td></tr>')}
    <h2 class="sec">Material Purchases</h2>
    ${tbl(['Date', 'Material', 'Vendor', 'Qty', 'Amount'], d.materialRows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${r.name}</td><td>${r.vendor}</td><td>${r.qty}</td><td class="r"><b>${inr(r.amount)}</b></td></tr>`).join('') || '<tr><td colspan="5" class="c">No records</td></tr>')}
    <h2 class="sec">Expenses</h2>
    ${tbl(['Date', 'Description', 'Category', 'Amount'], d.expenseRows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${r.description}</td><td>${r.category}</td><td class="r"><b>${inr(r.amount)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="c">No records</td></tr>')}
    <h2 class="sec">Vehicle Usage (hire + diesel)</h2>
    ${tbl(['Date', 'Vehicle', 'Work', 'Cost'], d.vehicleRows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${r.vehicle}</td><td>${r.work}</td><td class="r"><b>${inr(r.cost)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="c">No records</td></tr>')}
    <h2 class="sec">Labour (attendance-based)</h2>
    <table><tr><th>Particulars</th><th class="r">Amount</th></tr><tr><td>Total labour wages for period</td><td class="r"><b>${inr(d.labourTotal)}</b></td></tr></table>
    <div class="total-band"><div><div style="font-size:12px;letter-spacing:2px;color:#E8A20C;font-weight:800">INCOME ${inr(d.totals.income)} · COST ${inr(d.totals.cost)}</div></div><div class="v gold">${inr(d.totals.net)}</div></div>
    <div class="foot"><div>Generated by Sarvotam Construction OS</div><div class="sign">Authorised Signature</div></div>`;
  openPrint('Detailed Report — Sarvotam Construction', body);
}

export interface SalaryRow { name: string; skill: string; rate: number; present: number; half: number; absent: number; gross: number; advance: number; net: number }

export function printSalary(s: BusinessSettings, monthLabel: string, rows: SalaryRow[]) {
  const grand = rows.reduce((x, r) => x + r.net, 0);
  const body = `${letterhead(s, 'SALARY SHEET', `Month: ${monthLabel}`)}
    <h2 class="sec">Worker Salary — ${monthLabel}</h2>
    <table><tr><th>Worker</th><th>Skill</th><th class="r">Rate</th><th class="c">P</th><th class="c">H</th><th class="c">A</th><th class="r">Gross</th><th class="r">Advance</th><th class="r">Net Payable</th></tr>
    ${rows.map((r) => `<tr><td><b>${r.name}</b></td><td>${r.skill}</td><td class="r">${inr(r.rate)}</td><td class="c">${r.present}</td><td class="c">${r.half}</td><td class="c">${r.absent}</td><td class="r">${inr(r.gross)}</td><td class="r">${inr(r.advance)}</td><td class="r"><b>${inr(r.net)}</b></td></tr>`).join('')}
    </table>
    <div class="total-band"><div><div style="font-size:12px;letter-spacing:2px;color:#E8A20C;font-weight:800">GRAND TOTAL PAYABLE · ${rows.length} WORKERS</div></div><div class="v gold">${inr(grand)}</div></div>
    <div class="foot"><div>Prepared by Sarvotam Construction OS</div><div class="sign">Authorised Signature</div></div>`;
  openPrint(`Salary Sheet ${monthLabel} — Sarvotam Construction`, body);
}

export function printEstimate(s: BusinessSettings, e: Estimate, c: Client, p?: Project) {
  const body = `
    ${e.status === 'Draft' ? '<div class="wm">DRAFT</div>' : ''}
    ${letterhead(s, 'ESTIMATE', `${e.estimateNo} · Valid till ${fmtDate(e.validUntil)}`)}
    <div style="display:flex;gap:12px;margin-bottom:6px">
      <div class="stat" style="flex:1"><div class="l">Billed To</div><div style="font-weight:800;font-size:15px;margin-top:4px">${c.name}</div><div style="font-size:12px;color:#555">${c.address ?? ''}${c.phone ? `<br>${c.phone}` : ''}</div></div>
      <div class="stat" style="flex:1"><div class="l">Project</div><div style="font-weight:800;font-size:15px;margin-top:4px">${p?.name ?? '—'}</div><div style="font-size:12px;color:#555">${e.title}</div></div>
      <div class="stat" style="flex:1"><div class="l">Status</div><div style="font-weight:800;font-size:15px;margin-top:4px">${e.status}</div><div style="font-size:12px;color:#555">Date: ${fmtDateLong(e.createdAt)}</div></div>
    </div>
    <h2 class="sec">Scope of Work</h2>
    <table><tr><th style="width:36px">#</th><th>Work Item</th><th class="c">Qty</th><th>Unit</th><th class="r">Rate</th><th class="r">Amount</th></tr>
    ${e.items.map((it, i) => `<tr><td>${i + 1}</td><td><b>${it.name}</b></td><td class="c">${it.qty}</td><td>${it.unit}</td><td class="r">${inr(it.rate)}</td><td class="r"><b>${inr(it.amount)}</b></td></tr>`).join('')}
    <tr><td colspan="5" class="r" style="font-weight:700">Subtotal</td><td class="r"><b>${inr(e.subtotal)}</b></td></tr>
    <tr><td colspan="5" class="r" style="font-weight:700">GST @ ${e.gstPercent}%</td><td class="r"><b>${inr(e.gstAmount)}</b></td></tr>
    </table>
    <div class="total-band"><div><div style="font-size:12px;letter-spacing:2px;color:#E8A20C;font-weight:800">GRAND TOTAL</div></div><div class="v gold">${inr(e.total)}</div></div>
    ${e.note ? `<h2 class="sec">Note</h2><div class="terms">${e.note}</div>` : ''}
    <h2 class="sec">Terms & Conditions</h2><div class="terms">${s.terms}</div>
    <div class="foot"><div>For ${s.businessName}</div><div class="sign">Authorised Signature</div></div>`;
  openPrint(`${e.estimateNo} — Sarvotam Construction`, body);
}
