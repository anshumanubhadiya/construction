// ─── Sarvotam UI kit · motion-first primitives ───
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion';
import {
  AlertTriangle, Bell, CheckCircle2, Info, Search, X, XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { inr } from '../lib/format';
import { useToast, type ToastKind } from '../store/appStore';

// ───────── motion variants ─────────
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
};

export const toastVariants = {
  initial: { x: 90, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
  exit: { x: 90, opacity: 0, transition: { duration: 0.2 } },
};

// ───────── animated counter ─────────
export function AnimatedCounter({ value, format }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState((format ?? inr)(0));
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay((format ?? inr)(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{display}</span>;
}

// ───────── logo ─────────
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-night shadow-lg shadow-black/20">
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <path d="M7 22 L16 8 L25 22 Z" fill="#E8A20C" />
          <rect x="10.5" y="22" width="11" height="3" rx="1" fill="#FAF7F1" />
        </svg>
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/15 ring-inset" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className={`font-display text-[17px] font-bold ${dark ? 'text-white' : 'text-ink'}`}>
            Sarvotam
          </div>
          <div className={`text-[10px] font-bold tracking-[0.22em] uppercase ${dark ? 'text-gold' : 'text-golddeep'}`}>
            Construction
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── buttons ─────────
type BtnVariant = 'gold' | 'dark' | 'ghost' | 'outline' | 'danger' | 'success';
const btnStyles: Record<BtnVariant, string> = {
  gold: 'bg-gold text-night hover:bg-goldsoft shadow-lg shadow-gold/30',
  dark: 'bg-night text-paper hover:bg-ink2 shadow-lg shadow-black/20',
  ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
  outline: 'border-[1.5px] border-line bg-white/60 text-ink hover:border-gold hover:bg-amberwash/60',
  danger: 'bg-clay text-white hover:brightness-110 shadow-lg shadow-clay/30',
  success: 'bg-forest text-white hover:brightness-110 shadow-lg shadow-forest/30',
};

export function Btn({
  children, variant = 'gold', className = '', onClick, type, disabled, small,
}: {
  children: ReactNode; variant?: BtnVariant; className?: string;
  onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; small?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      type={type ?? 'button'}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? 'px-3 py-2 text-[13px]' : 'px-4 py-2.5 text-sm'
      } ${btnStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ───────── fields ─────────
export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-baseline justify-between text-[12.5px] font-bold text-ink/70">
      <span>{children}</span>
      {hint && <span className="text-[11px] font-semibold text-ink/40">{hint}</span>}
    </label>
  );
}

export function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs font-semibold text-clay">{error}</p>}
    </div>
  );
}

export function inputCls(extra = '') {
  return `field ${extra}`;
}

// ───────── badges ─────────
const badgeMap: Record<string, string> = {
  Active: 'bg-mint text-forest', Completed: 'bg-skywash text-steel',
  Planning: 'bg-amberwash text-bronze', 'On Hold': 'bg-blush text-clay',
  Present: 'bg-mint text-forest', 'Half Day': 'bg-amberwash text-bronze',
  Absent: 'bg-blush text-clay', Holiday: 'bg-linen text-ink/60',
  Paid: 'bg-mint text-forest', Unpaid: 'bg-blush text-clay',
  Draft: 'bg-linen text-ink/60', Sent: 'bg-skywash text-steel',
  Approved: 'bg-mint text-forest', Rejected: 'bg-blush text-clay',
  Pending: 'bg-amberwash text-bronze',
  admin: 'bg-night text-gold', client: 'bg-skywash text-steel',
  worker: 'bg-mint text-forest', supervisor: 'bg-plumwash text-plum',
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const key = String(children);
  const cls = tone ?? badgeMap[key] ?? 'bg-linen text-ink/70';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

// ───────── avatar ─────────
const avatarColors = [
  'from-gold to-clay', 'from-forest to-tealpop', 'from-steel to-plum',
  'from-clay to-golddeep', 'from-plum to-steel', 'from-tealpop to-forest',
];
export function Avatar({ name, size = 'md', photo }: { name: string; size?: 'sm' | 'md' | 'lg'; photo?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const color = avatarColors[(name.charCodeAt(0) + name.length) % avatarColors.length];
  if (photo) {
    return <img src={photo} alt={name} className={`${sizes[size]} rounded-full border-2 border-white object-cover shadow`} />;
  }
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'S';
  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-extrabold text-white shadow ${color}`}>
      {initials}
    </div>
  );
}

// ───────── progress bar ─────────
export function ProgressBar({ value, color = '#E8A20C', height = 8 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full overflow-hidden rounded-full bg-ink/10" style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
      />
    </div>
  );
}

// ───────── modal ─────────
export function Modal({
  open, onClose, title, subtitle, children, wide,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', fn);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-night/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-2xl sm:rounded-3xl sm:p-7 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[13px] font-medium text-ink/55">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10 hover:text-ink">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────── confirm dialog ─────────
export function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex items-start gap-3 rounded-2xl bg-blush/60 p-4">
        <AlertTriangle className="mt-0.5 shrink-0 text-clay" size={20} />
        <p className="text-sm leading-relaxed font-medium text-ink/80">{message}</p>
      </div>
      <div className="mt-5 flex gap-3">
        <Btn variant="outline" className="flex-1" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" className="flex-1" onClick={onConfirm}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ───────── empty state ─────────
export function EmptyState({
  icon, title, hint, action, onAction,
}: {
  icon: ReactNode; title: string; hint: string; action?: string; onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card-paper flex flex-col items-center rounded-3xl px-6 py-12 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amberwash text-golddeep">{icon}</div>
      <h4 className="font-display mt-4 text-lg font-bold">{title}</h4>
      <p className="mt-1 max-w-xs text-sm font-medium text-ink/55">{hint}</p>
      {action && onAction && (
        <Btn className="mt-5" onClick={onAction}>{action}</Btn>
      )}
    </motion.div>
  );
}

// ───────── search ─────────
export function SearchInput({ placeholder, onSearch, className = '' }: { placeholder: string; onSearch: (q: string) => void; className?: string }) {
  const [val, setVal] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const change = (v: string) => {
    setVal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(v), 300);
  };
  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/35" />
      <input
        value={val}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
        className="field pr-9 pl-10"
      />
      {val && (
        <button onClick={() => change('')} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink/35 hover:text-ink">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ───────── skeletons ─────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}

// ───────── page header ─────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-[26px] leading-tight font-bold text-ink sm:text-3xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-1 text-sm font-medium text-ink/55">
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ───────── success check ─────────
export function SuccessCheck({ size = 64 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 64 64"
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      <circle cx="32" cy="32" r="29" fill="#0B6B4F" opacity="0.12" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#0B6B4F" strokeWidth="3" />
      <path d="M21 33 L29 41 L44 25" fill="none" stroke="#0B6B4F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="check-path" />
    </motion.svg>
  );
}

// ───────── toasts viewport ─────────
const toastIcon: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={20} className="text-forest" />,
  error: <XCircle size={20} className="text-clay" />,
  warning: <AlertTriangle size={20} className="text-golddeep" />,
  info: <Info size={20} className="text-steel" />,
};

export function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id} variants={toastVariants} initial="initial" animate="animate" exit="exit" layout
            className="card-paper pointer-events-auto relative overflow-hidden rounded-2xl p-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{toastIcon[t.kind]}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{t.title}</div>
                {t.message && <div className="mt-0.5 text-[13px] leading-snug font-medium text-ink/60">{t.message}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} className="cursor-pointer text-ink/30 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="toast-bar absolute bottom-0 left-0 h-[3px] bg-gold" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function BellDot({ count }: { count: number }) {
  return (
    <div className="relative">
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] font-extrabold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}
