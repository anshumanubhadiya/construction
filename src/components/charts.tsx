// ─── Chart wrappers · Recharts with Sarvotam styling ───
import { motion } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { inrShort } from '../lib/format';

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-[#fffdf7] px-3.5 py-2.5 shadow-xl">
      {label && <div className="mb-1 text-xs font-extrabold text-ink/60">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px] font-bold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color ?? '#E8A20C' }} />
          <span className="text-ink/55">{p.name}:</span>
          <span>{inrShort(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyBars({ data }: { data: { label: string; income: number; cost: number }[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={5}>
          <CartesianGrid strokeDasharray="3 6" stroke="#E5DCC6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11.5, fontWeight: 700, fill: '#6b7a99' }} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#6b7a99' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => inrShort(v)} width={64} />
          <Tooltip content={<ChartTip />} cursor={{ fill: '#E8A20C22' }} />
          <Bar name="Income" dataKey="income" fill="#0B6B4F" radius={[6, 6, 2, 2]} maxBarSize={26} animationDuration={900} />
          <Bar name="Cost" dataKey="cost" fill="#C2491D" radius={[6, 6, 2, 2]} maxBarSize={26} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function CostDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((x, d) => x + d.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
      <div className="h-[210px] w-full max-w-[230px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} cornerRadius={7} strokeWidth={0} animationDuration={900}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid w-full grid-cols-1 gap-1.5">
        {data.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="flex items-center gap-2.5 rounded-xl bg-ink/[0.03] px-3 py-2"
          >
            <span className="h-3 w-3 shrink-0 rounded-[5px]" style={{ background: d.color }} />
            <span className="flex-1 truncate text-[12.5px] font-bold text-ink/70">{d.name}</span>
            <span className="text-[12.5px] font-extrabold">{Math.round((d.value / total) * 100)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ProfitLine({ data }: { data: { label: string; profit: number }[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8A20C" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#E8A20C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="#E5DCC6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11.5, fontWeight: 700, fill: '#6b7a99' }} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#6b7a99' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => inrShort(v)} width={64} />
          <Tooltip content={<ChartTip />} cursor={{ stroke: '#E8A20C', strokeDasharray: '4 4' }} />
          <Area name="Net Profit" type="monotone" dataKey="profit" stroke="#9A6200" strokeWidth={3} fill="url(#profitFill)" dot={{ r: 3.5, fill: '#E8A20C', strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1000} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
