// ─── Error boundary · friendly recovery instead of blank white screens ───
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, WifiOff } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { error: Error | null }

const isChunkError = (msg: string) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Sarvotam] caught render error:', error, info.componentStack);
    // A stale page after the dev server restarted can't fetch its lazy chunk.
    // One automatic reload fixes it; the guard prevents reload loops.
    if (isChunkError(error.message) && !sessionStorage.getItem('chunk-reloaded')) {
      sessionStorage.setItem('chunk-reloaded', '1');
      window.location.reload();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const offline = isChunkError(error.message) || !navigator.onLine;
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-paper w-full max-w-md rounded-3xl p-8 text-center">
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${offline ? 'bg-skywash text-steel' : 'bg-blush text-clay'}`}>
            {offline ? <WifiOff size={26} /> : <AlertTriangle size={26} />}
          </div>
          <h2 className="font-display mt-4 text-xl font-bold">
            {offline ? 'The connection dropped mid-load' : 'Something broke on this screen'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed font-medium text-ink/55">
            {offline
              ? 'This happens when the preview server restarts while your tab is open. One refresh and you are back.'
              : 'Your data is safe — nothing was lost. Reload to continue, and if it keeps happening, tell the developer what you were doing.'}
          </p>
          <p className="mt-3 overflow-hidden truncate rounded-xl bg-ink/4 px-3 py-2 text-left font-mono text-[11px] font-semibold text-ink/45">
            {error.message}
          </p>
          <button
            onClick={() => { sessionStorage.removeItem('chunk-reloaded'); window.location.reload(); }}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-night px-6 py-3 text-sm font-extrabold text-white transition hover:bg-ink2"
          >
            <RotateCcw size={15} className="text-gold" /> Reload
          </button>
        </motion.div>
      </div>
    );
  }
}
