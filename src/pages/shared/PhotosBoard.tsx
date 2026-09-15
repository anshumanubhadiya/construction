// ─── Site photos · proof-of-work gallery + upload (Supabase Storage) ───
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera, CheckCircle2, ChevronLeft, ChevronRight, CloudUpload, ImageOff,
  Trash2, X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import {
  Btn, EmptyState, Field, Modal, ProgressBar, Skeleton, inputCls, pageVariants,
} from '../../components/ui';
import { fmtDate, timeAgo } from '../../lib/format';
import { sessionProfile, toast, useApp } from '../../store/appStore';
import type { SitePhoto } from '../../types';

type Variant = 'admin' | 'supervisor' | 'client';

export default function PhotosBoard({ variant }: { variant: Variant }) {
  const photos = useApp((s) => s.photos);
  const projects = useApp((s) => s.projects);
  const me = useApp(sessionProfile);
  const cloudLoading = useApp((s) => s.cloudLoading);
  const [filter, setFilter] = useState('');
  const [zoom, setZoom] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const canUpload = variant !== 'client' && (me?.role === 'admin' || me?.role === 'staff' || me?.role === 'supervisor');
  const isOwner = me?.role === 'admin';

  // clients only ever see their own projects' updates
  const visible = useMemo(() => {
    let list = photos;
    if (variant === 'client') {
      const myProjectIds = new Set(
        projects.filter((p) => p.clientId === me?.linkedId).map((p) => p.id),
      );
      list = list.filter((p) => myProjectIds.has(p.projectId));
    }
    if (filter) list = list.filter((p) => p.projectId === filter);
    return list;
  }, [photos, projects, me?.linkedId, variant, filter]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'General';
  const step = (dir: 1 | -1) =>
    setZoom((z) => (z === null ? null : (z + dir + visible.length) % visible.length));

  return (
    <PageWrapper>
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-bold">
              {variant === 'client' ? 'Site Updates' : 'Site Photos'}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-ink/50">
              {variant === 'client'
                ? 'Photo proof of work on your project, straight from the site.'
                : 'Proof of work — upload from your phone camera in seconds. Everyone on the team sees updates instantly.'}
            </p>
          </div>
          {canUpload && (
            <Btn variant="dark" onClick={() => setUploadOpen(true)}>
              <Camera size={16} /> Upload photo
            </Btn>
          )}
        </div>

        {/* project filter chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[{ id: '', name: 'All sites' }, ...projects.map((p) => ({ id: p.id, name: p.name }))]
            .filter((chip) => variant !== 'client' || chip.id === '' || visible.some((v) => v.projectId === chip.id) || filter === chip.id)
            .map((chip) => (
              <button
                key={chip.id || 'all'}
                onClick={() => setFilter(chip.id)}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition ${
                  filter === chip.id ? 'bg-night text-white' : 'bg-white text-ink/55 ring-1 ring-line hover:text-ink'
                }`}
              >
                {chip.name}
              </button>
            ))}
        </div>

        {/* grid */}
        {cloudLoading && visible.length === 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-4/3 rounded-2xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ImageOff size={30} />}
            title={variant === 'client' ? 'No photos yet' : 'No site photos yet'}
            hint={canUpload
              ? 'Upload the first photo from your camera — it lands on every teammate’s device instantly.'
              : 'Photos posted by the site team will appear here.'}
            action={canUpload ? 'Upload the first photo' : undefined}
            onAction={canUpload ? () => setUploadOpen(true) : undefined}
          />
        ) : (
          <motion.div layout className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visible.map((ph, i) => (
                <PhotoCard
                  key={ph.id}
                  photo={ph}
                  projectName={projectName(ph.projectId)}
                  canDelete={isOwner || ph.uploaderId === me?.id}
                  onOpen={() => setZoom(i)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* lightbox */}
        <AnimatePresence>
          {zoom !== null && visible[zoom] && (
            <Lightbox
              photo={visible[zoom]}
              projectName={projectName(visible[zoom].projectId)}
              count={`${zoom + 1} / ${visible.length}`}
              onClose={() => setZoom(null)}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
            />
          )}
        </AnimatePresence>

        {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} defaultProject={filter} />}
      </motion.div>
    </PageWrapper>
  );
}

function PhotoCard({ photo, projectName, canDelete, onOpen }: {
  photo: SitePhoto; projectName: string; canDelete: boolean; onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:shadow-lg"
      onClick={onOpen}
    >
      <div className="aspect-4/3 w-full overflow-hidden bg-ink/5">
        {!loaded && !broken && <div className="h-full w-full animate-pulse bg-ink/8" />}
        {broken ? (
          <div className="grid h-full place-items-center text-ink/25"><ImageOff size={28} /></div>
        ) : (
          <img
            src={photo.fileUrl} alt={photo.title || 'Site photo'} loading="lazy"
            onLoad={() => setLoaded(true)} onError={() => setBroken(true)}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.045] ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pt-8 pb-2.5">
        <p className="truncate text-[12.5px] font-extrabold text-white">{photo.title || 'Site update'}</p>
        <p className="truncate text-[10.5px] font-bold text-white/65">{projectName} · {timeAgo(photo.createdAt)}</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); void useApp.getState().deletePhoto(photo.id); }}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl bg-black/55 text-white backdrop-blur transition hover:bg-clay"
            aria-label="Delete photo"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Lightbox({ photo, projectName, count, onClose, onPrev, onNext }: {
  photo: SitePhoto; projectName: string; count: string; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-night/92 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}
      >
        <img src={photo.fileUrl} alt={photo.title || 'Site photo'} className="max-h-[74vh] w-full rounded-2xl object-contain" />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-bold text-white">{photo.title || 'Site update'}</p>
            <p className="text-[12.5px] font-semibold text-white/55">
              {projectName} · {fmtDate(photo.date)} · {photo.uploaderName || 'Team'} · {timeAgo(photo.createdAt)}
            </p>
            {photo.note && <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed font-medium text-white/70">{photo.note}</p>}
          </div>
          <span className="text-xs font-bold text-white/40">{count}</span>
        </div>
        <button onClick={onClose} className="absolute -top-3 -right-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white text-night shadow-lg transition hover:scale-105" aria-label="Close"><X size={16} /></button>
        {count.split(' / ')[1] !== '1' && (
          <>
            <button onClick={onPrev} className="absolute top-1/2 -left-4 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-night shadow-lg transition hover:scale-105 sm:-left-14" aria-label="Previous"><ChevronLeft size={18} /></button>
            <button onClick={onNext} className="absolute top-1/2 -right-4 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-night shadow-lg transition hover:scale-105 sm:-right-14" aria-label="Next"><ChevronRight size={18} /></button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function UploadModal({ onClose, defaultProject }: { onClose: () => void; defaultProject: string }) {
  const projects = useApp((s) => s.projects);
  const uploadPhoto = useApp((s) => s.uploadPhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({
    title: '', note: '', projectId: defaultProject || projects[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);

  const pick = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Only image files are supported');
    if (f.size > 12 * 1024 * 1024) return toast.error('Photo too large', 'Please keep images under 12 MB.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!form.title) setForm((s) => ({ ...s, title: f.name.replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' ').slice(0, 60) }));
  };

  const submit = async () => {
    if (!file) return toast.error('Choose a photo first');
    setBusy(true); setPct(0);
    try {
      await uploadPhoto(file, form, setPct);
      onClose();
    } catch (err: unknown) {
      toast.error('Upload failed', (err as Error)?.message || 'Please try again.');
      setPct(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Upload site photo">
      <div className="space-y-3.5">
        {/* picker */}
        {!preview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
            className="grid cursor-pointer place-items-center rounded-2xl border-[1.5px] border-dashed border-line bg-ink/3 px-4 py-10 text-center transition hover:border-gold hover:bg-amberwash/40"
            onClick={() => fileRef.current?.click()}
          >
            <CloudUpload size={30} className="text-golddeep" />
            <p className="mt-2 text-sm font-extrabold">Drop a photo or tap to browse</p>
            <p className="mt-0.5 text-xs font-semibold text-ink/45">JPG / PNG up to 12 MB · drag & drop works too</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); camRef.current?.click(); }} className="cursor-pointer rounded-xl bg-night px-4 py-2 text-[12.5px] font-extrabold text-white">
                <Camera size={13} className="mr-1 inline" /> Take photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl">
            <img src={preview} alt="Selected" className="max-h-56 w-full object-cover" />
            <button onClick={() => { setFile(null); setPreview(''); }} className="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-clay" aria-label="Remove"><X size={14} /></button>
            {busy ? (
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 backdrop-blur">
                <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-extrabold text-white">
                  <span>{pct < 100 ? 'Uploading to Supabase Storage…' : 'Saving record…'}</span><span>{pct}%</span>
                </div>
                <ProgressBar value={pct} height={6} />
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-2 left-2 cursor-pointer rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur">Replace</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Slab casting — 1st floor" className={inputCls()} /></Field>
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls()} /></Field>
        </div>
        <Field label="Project site">
          <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className={inputCls()}>
            <option value="">— No specific site —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Note (optional)"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Bar bending complete, ready for inspection…" className={inputCls()} /></Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11.5px] leading-snug font-semibold text-ink/40"><CheckCircle2 size={12} className="mr-1 inline text-forest" />Visible to the owner{form.projectId ? ' and that client’s portal' : ''} the moment it uploads.</p>
          <div className="flex shrink-0 gap-2">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="gold" disabled={!file || busy} onClick={() => void submit()}>{busy ? 'Uploading…' : 'Upload photo'}</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── routed entries ───
export function AdminPhotosPage() {
  return <PhotosBoard variant="admin" />;
}
export function SupervisorPhotosPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6">
      <PhotosBoard variant="supervisor" />
    </div>
  );
}
export function ClientPhotosPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6">
      <PhotosBoard variant="client" />
    </div>
  );
}
