// ─── Cloud sync · pull / push / realtime / attendance day-replace ───
import { api, PHOTO_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabaseClient';
import {
  CLOUD_TABLES, sanitize, type CloudTable,
} from './adapters';

// PostgREST "unknown column" → drop and retry (schema tolerance).
const MISSING_COL = /Could not find the '([^']+)' column|column '([^']+' of table)/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = Record<string, any>;

async function writeWithStrip(
  table: CloudTable, obj: AnyRec, mode: 'post' | 'patch', id?: string | number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const payload: AnyRec = { ...obj };
  for (let attempt = 0; attempt < 7; attempt++) {
    try {
      const res =
        mode === 'post'
          ? await api.post(table, payload)
          : await api.patch(table, id as string | number, payload);
      return res;
    } catch (err: unknown) {
      const msg = String((err as Error)?.message || '');
      const m = msg.match(MISSING_COL);
      const col = m ? (m[1] || m[2] || '').replace(/'$/, '') : '';
      if (col && col in payload) { delete payload[col]; continue; }
      throw err;
    }
  }
  throw new Error('Cloud write failed after retries');
}

export async function saveToCloud(table: CloudTable, entity: AnyRec, isNew: boolean): Promise<AnyRec | null> {
  const row = sanitize(table, entity);
  if (isNew) return writeWithStrip(table, row, 'post');
  return writeWithStrip(table, row, 'patch', entity.id);
}

export async function deleteFromCloud(table: CloudTable, id: string): Promise<void> {
  if (!id || Number.isNaN(Number(id))) return; // temp id → never in cloud
  await api.delete(table, id);
}

/** Parallel fetch of every cloud table. */
export async function pullAll(): Promise<Partial<Record<CloudTable, AnyRec[]>>> {
  const settled = await Promise.allSettled(CLOUD_TABLES.map((t) => api.get(t)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Partial<Record<CloudTable, any[]>> = {};
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') out[CLOUD_TABLES[i]] = (r.value as AnyRec[]) || [];
  });
  const failed = settled.some((r) => r.status === 'rejected');
  if (failed && Object.keys(out).length === 0) {
    const reason = settled.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    throw reason.reason instanceof Error ? reason.reason : new Error('Data load failed');
  }
  return out;
}

/** Replace one day's attendance in the cloud (delete day rows + insert fresh). */
export async function replaceDayAttendance(date: string, rows: AnyRec[], markedBy: string): Promise<void> {
  if (!date || rows.length === 0) return;
  const numeric = (v: unknown) => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));
  const pushable: AnyRec[] = rows
    .filter((r) => numeric(r.workerId))
    .map((r) => ({ ...r, markedBy: markedBy || r.markedBy || '' }));
  if (pushable.length === 0) return; // ids not resolved yet — skip, never wipe
  const workerIds = [...new Set(pushable.map((r) => String(r.workerId)))];
  try {
    await api.remove('attendance', `date=eq.${date}&worker_id=in.(${workerIds.join(',')})`);
  } catch { /* unique index covers dupes even if delete fails */ }
  for (const r of pushable) {
    await writeWithStrip('attendance', sanitize('attendance', r), 'post');
  }
}

// ───────── site photos ─────────
export interface PhotoUploadMeta {
  projectId: string; title: string; note: string; date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploaderId: any; uploaderName: string;
}

/** Upload to Storage (with progress) + insert DB row. Returns the row. */
export async function uploadSitePhoto(
  file: File, meta: PhotoUploadMeta, onProgress: (pct: number) => void,
): Promise<AnyRec | null> {
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-40) || 'photo.jpg';
  const path = `photos/${meta.date || new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.send(file);
  });
  onProgress(100);

  return api.post('site_photos', {
    project_id: meta.projectId ? Number(meta.projectId) : null,
    title: meta.title || null,
    note: meta.note || null,
    date: meta.date || new Date().toISOString().slice(0, 10),
    file_path: path,
    file_url: `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`,
    uploader_id: meta.uploaderId || null,
    uploader_name: meta.uploaderName || 'Team',
  });
}

export async function deleteSitePhoto(row: AnyRec): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;
    await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${row.filePath}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
  } catch { /* file may already be gone — row delete still matters */ }
  await api.delete('site_photos', row.id);
}

// ───────── realtime ─────────
/** Subscribe to any change on the business tables; callback is debounced. */
export function subscribeRealtime(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const fire = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onChange, 600);
  };
  const channel = supabase
    .channel('sarvotam-sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, fire)
    .subscribe();
  return () => {
    if (timer) clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}

// ───────── one-time sample data publish ─────────
export async function uploadAllToCloud(s: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any[];
}): Promise<{
  clients: Map<string, string>; workers: Map<string, string>;
  vehicles: Map<string, string>; projects: Map<string, string>;
}> {
  const maps = {
    clients: new Map<string, string>(),
    workers: new Map<string, string>(),
    vehicles: new Map<string, string>(),
    projects: new Map<string, string>(),
  };
  const postOne = (table: CloudTable, row: AnyRec) => writeWithStrip(table, row, 'post');

  for (const c of s.clients || []) {
    const saved = await postOne('clients', sanitize('clients', c));
    maps.clients.set(String(c.id), String(saved.id));
  }
  for (const w of s.workers || []) {
    const saved = await postOne('workers', sanitize('workers', w));
    maps.workers.set(String(w.id), String(saved.id));
  }
  for (const v of s.vehicles || []) {
    const saved = await postOne('vehicles', sanitize('vehicles', v));
    maps.vehicles.set(String(v.id), String(saved.id));
  }
  for (const p of s.projects || []) {
    const remapped = { ...p, clientId: maps.clients.get(String(p.clientId)) ?? p.clientId };
    const saved = await postOne('projects', sanitize('projects', remapped));
    maps.projects.set(String(p.id), String(saved.id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remap = (r: any) => ({
    ...r,
    clientId: maps.clients.get(String(r.clientId)) ?? r.clientId,
    projectId: maps.projects.get(String(r.projectId)) ?? r.projectId,
    workerId: maps.workers.get(String(r.workerId)) ?? r.workerId,
    vehicleId: maps.vehicles.get(String(r.vehicleId)) ?? r.vehicleId,
  });

  const chunked = async (table: CloudTable, list: AnyRec[], size = 12) => {
    for (let i = 0; i < list.length; i += size) {
      await Promise.all(
        list.slice(i, i + size).map((r) => postOne(table, sanitize(table, remap(r)))),
      );
    }
  };

  await chunked('attendance', s.attendance || []);
  await chunked('materials', s.materials || []);
  await chunked('income', s.income || []);
  await chunked('expenses', s.expenses || []);
  await chunked('vehicle_logs', s.vehicleLogs || []);

  return maps;
}
