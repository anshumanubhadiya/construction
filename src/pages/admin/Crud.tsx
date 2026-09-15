// ─── Shared CRUD primitives · tables, pagination, filters ───
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

// open "new" modal when ?new=1 is present (used by FAB / quick actions)
export function useAutoNew(): boolean {
  const [params, setParams] = useSearchParams();
  const [auto, setAuto] = useState(params.get('new') === '1');
  useEffect(() => {
    if (params.get('new') === '1') {
      setAuto(true);
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return auto;
}

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns, rows, perPage = 10, empty,
}: {
  columns: Column<T>[]; rows: T[]; perPage?: number; empty: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(page, pages);
  const slice = useMemo(
    () => rows.slice((safePage - 1) * perPage, safePage * perPage),
    [rows, safePage, perPage],
  );

  useEffect(() => setPage(1), [rows.length]);

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div className="card-paper overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-cream/70">
              {columns.map((c, i) => (
                <th key={i} className={`px-4 py-3 text-[11px] font-extrabold tracking-wider whitespace-nowrap text-ink/50 uppercase ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {slice.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-amberwash/40"
                >
                  {columns.map((c, i) => (
                    <td key={i} className={`px-4 py-3 text-[13.5px] font-semibold whitespace-nowrap ${c.className ?? ''}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-line bg-cream/50 px-4 py-2.5">
          <span className="text-xs font-bold text-ink/50">
            Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line bg-white text-ink/60 transition hover:border-gold disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-1 text-xs font-extrabold">{safePage} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={safePage === pages}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line bg-white text-ink/60 transition hover:border-gold disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {label && <span className="mr-1 hidden text-xs font-bold text-ink/40 xl:inline">{label}</span>}
      <button
        onClick={onEdit}
        title="Edit"
        className="grid h-8.5 w-8.5 cursor-pointer place-items-center rounded-lg bg-skywash p-2 text-steel transition hover:brightness-95"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="grid h-8.5 w-8.5 cursor-pointer place-items-center rounded-lg bg-blush p-2 text-clay transition hover:brightness-95"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function FilterChips<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition ${
            value === o.value
              ? 'bg-night text-gold shadow'
              : 'border-[1.5px] border-line bg-white/60 text-ink/55 hover:border-gold/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>;
}

export function MoneyCell({ value, positive }: { value: string; positive?: boolean }) {
  return <span className={`font-extrabold ${positive ? 'text-forest' : ''}`}>{value}</span>;
}
