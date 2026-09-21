// ─── Central store · Supabase Auth + RBAC + cloud CRUD + realtime ───
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeed, type SeedData } from '../data/seed';
import { cloudFromRow, hasTempFk, isTempId, type CloudTable } from '../services/adapters';
import {
  adminSetProfile, changeCloudPassword, cloudSignIn, cloudSignOut, cloudSignUp,
  fetchAllProfiles, fetchMyProfile, requestPasswordReset, type ProfileRow,
} from '../services/auth';
import {
  deleteSitePhoto, pullAll, replaceDayAttendance, saveToCloud,
  subscribeRealtime, uploadAllToCloud, uploadSitePhoto,
} from '../services/sync';
import { supabase } from '../services/supabaseClient';
import type {
  Attendance, BusinessSettings, Client, Estimate, Expense, Income, Material,
  Notification, Profile, Project, Role, SitePhoto, Vehicle, VehicleLog, Worker,
} from '../types';
import { lastNMonths, monthKey, monthLabel, todayISO, uid } from '../lib/format';

interface AuthResult { ok: boolean; message: string; role?: Role; needsConfirmation?: boolean }

interface AppState extends SeedData {
  // auth
  authChecked: boolean;
  authProfile: ProfileRow | null;
  bootstrapAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  signup: (d: {
    name: string; phone: string; email: string; password: string;
    role: 'client' | 'worker' | 'supervisor' | 'staff'; joinCode?: string;
  }) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<string>;
  changePassword: (current: string, next: string) => Promise<void>;
  saveMyProfile: (patch: { name?: string; phone?: string; avatar_url?: string }) => Promise<void>;

  // cloud sync
  schemaReady: boolean | null; // null = not checked / network issue
  checkSchema: () => Promise<void>;
  cloudLoading: boolean;
  cloudError: string;
  lastSyncedAt: string;
  cloudPulled: boolean;
  refreshFromCloud: () => Promise<void>;
  publishSampleData: () => Promise<void>;
  cloudPush: (table: CloudTable, entity: unknown) => void;
  cloudRemove: (table: CloudTable, id: string) => void;
  replaceCloudId: (table: CloudTable, tempId: string, realId: string) => void;

  // admin user management (cloud profiles)
  approveSignup: (userId: string, link?: { kind: 'worker' | 'client'; id: string } | null) => Promise<void>;
  rejectSignup: (userId: string) => Promise<void>;
  setUserRole: (userId: string, role: Role) => Promise<void>;
  setUserActive: (userId: string, active: boolean) => Promise<void>;
  updateProfile: (userId: string, patch: Partial<Profile>) => void;

  // site photos
  photos: SitePhoto[];
  uploadPhoto: (
    file: File,
    meta: { projectId: string; title: string; note: string; date: string },
    onProgress: (pct: number) => void,
  ) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  upsertProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  upsertClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  upsertWorker: (w: Worker) => void;
  deleteWorker: (id: string) => void;
  upsertMaterial: (m: Material) => void;
  deleteMaterial: (id: string) => void;
  upsertIncome: (i: Income) => void;
  deleteIncome: (id: string) => void;
  upsertExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  upsertVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  upsertVehicleLog: (l: VehicleLog) => void;
  deleteVehicleLog: (id: string) => void;
  upsertEstimate: (e: Estimate) => void;
  deleteEstimate: (id: string) => void;
  saveDayAttendance: (rows: Attendance[]) => void;
  deleteAttendance: (id: string) => void;

  pushNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markNotification: (id: string) => void;
  markAllRead: () => void;

  updateSettings: (patch: Partial<BusinessSettings>) => void;
  nextEstimateNo: () => string;
  resetDemo: () => void;
}

const LIST_KEY: Record<CloudTable, keyof SeedData> = {
  clients: 'clients', projects: 'projects', workers: 'workers', attendance: 'attendance',
  materials: 'materials', income: 'income', expenses: 'expenses', vehicles: 'vehicles',
  vehicle_logs: 'vehicleLogs', site_photos: 'photos' as keyof SeedData,
};

const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) {
    const copy = [...list];
    copy[i] = item;
    return copy;
  }
  return [item, ...list];
};

let realtimeUnsub: (() => void) | null = null;

function startRealtime() {
  if (realtimeUnsub) return;
  realtimeUnsub = subscribeRealtime(() => {
    // another device changed data → refetch (silent)
    useApp.getState().refreshFromCloud().catch(() => undefined);
  });
}
function stopRealtime() {
  realtimeUnsub?.();
  realtimeUnsub = null;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      authChecked: false,
      authProfile: null,

      schemaReady: null,
      cloudLoading: false,
      cloudError: '',
      lastSyncedAt: '',
      cloudPulled: false,
      photos: [],

      // Does the database exist yet? 404 on a known table = SQL not run.
      checkSchema: async () => {
        try {
          const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../services/supabaseClient');
          const res = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=id&limit=1`, {
            headers: { apikey: SUPABASE_ANON_KEY },
          });
          set({ schemaReady: res.status !== 404 });
        } catch {
          set({ schemaReady: null }); // offline — don't nag
        }
      },

      // ───────── auth ─────────
      bootstrapAuth: async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const me = await fetchMyProfile(data.session.user.id).catch(() => null);
            if (me) {
              set({ authProfile: me, authChecked: true });
              if (me.active) {
                startRealtime();
                await get().refreshFromCloud();
              }
              return;
            }
          }
          set({ authChecked: true });
        } catch {
          set({ authChecked: true });
        }
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            if (get().authProfile) {
              stopRealtime();
              set({ authProfile: null });
            }
          }
        });
      },

      login: async (email, password) => {
        try {
          const me = await cloudSignIn(email, password);
          if (me.status !== 'active') {
            if (me.status === 'rejected') {
              await cloudSignOut();
              set({ authProfile: me, authChecked: true });
              return { ok: false, message: 'Your request was declined. Contact the office.' };
            }
            // pending → keep profile for Pending page, but clear session
            set({ authProfile: me, authChecked: true });
            await cloudSignOut().catch(() => undefined);
            return { ok: false, message: 'pending', needsConfirmation: true };
          }
          set({ authProfile: me, authChecked: true });
          startRealtime();
          void get().refreshFromCloud();
          return { ok: true, message: `Welcome back, ${me.name.split(' ')[0]}!`, role: me.role };
        } catch (err: unknown) {
          return { ok: false, message: (err as Error)?.message || 'Login failed.' };
        }
      },

      logout: () => {
        stopRealtime();
        set({ authProfile: null });
        void cloudSignOut();
      },

      signup: async (d) => {
        try {
          const res = await cloudSignUp(d);
          // active immediately (first user = admin, or valid join code)
          if (res.profile?.status === 'active') {
            set({ authProfile: res.profile, authChecked: true });
            startRealtime();
            void get().refreshFromCloud();
            return { ok: true, message: `Welcome aboard, ${res.profile.name.split(' ')[0]}!`, role: res.profile.role };
          }
          // pending profile exists (email confirmation OFF, awaiting owner approval)
          if (res.profile) {
            set({ authProfile: res.profile, authChecked: true });
            await cloudSignOut().catch(() => undefined);
            return { ok: false, message: 'pending', needsConfirmation: res.needsConfirmation };
          }
          // no session → email confirmation required (Supabase setting ON)
          if (res.needsConfirmation) {
            set({ authProfile: null, authChecked: true });
            return {
              ok: false,
              needsConfirmation: true,
              message: 'pending',
            };
          }
          // fallback: profile not yet visible but signup succeeded
          set({ authProfile: null, authChecked: true });
          await cloudSignOut().catch(() => undefined);
          return { ok: false, needsConfirmation: true, message: 'pending' };
        } catch (err: unknown) {
          return { ok: false, message: (err as Error)?.message || 'Signup failed.' };
        }
      },

      forgotPassword: async (email) => {
        try {
          return await requestPasswordReset(email);
        } catch (err: unknown) {
          return (err as Error)?.message || 'Could not send the reset email right now.';
        }
      },

      changePassword: async (current, next) => {
        const me = get().authProfile;
        if (!me) throw new Error('Not signed in.');
        await changeCloudPassword(me.email, current, next);
        toast.success('Password updated', 'Your new password is active on all devices.');
      },

      saveMyProfile: async (patch) => {
        const me = get().authProfile;
        if (!me) throw new Error('Not signed in.');
        await (await import('../services/auth')).updateCloudProfile(me.id, patch);
        set({ authProfile: { ...me, ...patch, ...(patch.avatar_url ? { avatar: patch.avatar_url } : {}) } });
        toast.success('Profile updated');
      },

      // ───────── cloud pull ─────────
      refreshFromCloud: async () => {
        if (!get().authProfile || get().cloudLoading) return;
        set({ cloudLoading: true, cloudError: '' });
        try {
          const res = await pullAll();
          set((s) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            projects: res.projects ? res.projects.map((r: any) => cloudFromRow.projects(r)) : s.projects,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clients: res.clients ? res.clients.map((r: any) => cloudFromRow.clients(r)) : s.clients,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            workers: res.workers ? res.workers.map((r: any) => cloudFromRow.workers(r)) : s.workers,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            attendance: res.attendance ? res.attendance.map((r: any) => cloudFromRow.attendance(r)) : s.attendance,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            materials: res.materials ? res.materials.map((r: any) => cloudFromRow.materials(r)) : s.materials,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            income: res.income ? res.income.map((r: any) => cloudFromRow.income(r)) : s.income,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expenses: res.expenses ? res.expenses.map((r: any) => cloudFromRow.expenses(r)) : s.expenses,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vehicles: res.vehicles ? res.vehicles.map((r: any) => cloudFromRow.vehicles(r)) : s.vehicles,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vehicleLogs: res.vehicle_logs ? res.vehicle_logs.map((r: any) => cloudFromRow.vehicle_logs(r)) : s.vehicleLogs,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            photos: res.site_photos ? res.site_photos.map((r: any) => cloudFromRow.site_photos(r)) : s.photos,
            cloudLoading: false,
            cloudError: '',
            lastSyncedAt: new Date().toISOString(),
            cloudPulled: true,
          }));
          // admin/staff also refresh the user directory
          const role = get().authProfile?.role;
          if (role === 'admin' || role === 'staff') {
            fetchAllProfiles()
              .then((list) => set({ profiles: list }))
              .catch(() => undefined);
          }
        } catch (err: unknown) {
          set({ cloudLoading: false, cloudError: (err as Error)?.message || 'Data load failed' });
          toast.error('Could not reach Supabase', 'Showing cached data. Check setup/connection.');
        }
      },

      // ───────── publish sample business data (no credentials ever) ─────────
      publishSampleData: async () => {
        const st = get();
        if (st.cloudLoading) return;
        if (st.authProfile?.role !== 'admin') {
          toast.error('Only the owner can publish sample data');
          return;
        }
        set({ cloudLoading: true, cloudError: '' });
        try {
          const existing = await pullAll();
          const total = Object.values(existing).reduce((x, arr) => x + (arr as unknown[]).length, 0);
          if (total > 0) {
            set({ cloudLoading: false });
            toast.warning('Database already has records', 'Sample publish skipped to avoid duplicates.');
            return;
          }
          const s = get();
          const maps = await uploadAllToCloud({
            clients: s.clients, workers: s.workers, vehicles: s.vehicles, projects: s.projects,
            attendance: s.attendance, materials: s.materials, income: s.income,
            expenses: s.expenses, vehicleLogs: s.vehicleLogs,
          });
          set((prev) => ({
            estimates: prev.estimates.map((e) => ({
              ...e,
              clientId: maps.clients.get(e.clientId) ?? e.clientId,
              projectId: maps.projects.get(e.projectId) ?? e.projectId,
            })),
            cloudLoading: false,
          }));
          toast.success('Sample data published', 'Loading it back from the cloud…');
          await get().refreshFromCloud();
        } catch (err: unknown) {
          set({ cloudLoading: false, cloudError: (err as Error)?.message || 'Publish failed' });
          toast.error('Publish failed', (err as Error)?.message || 'Run the SQL setup first, then retry.');
        }
      },

      // ───────── write-through ─────────
      cloudPush: (table, entity) => {
        if (!get().authProfile) return;
        void (async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let ent: any = entity;
            if (hasTempFk(table, ent)) {
              // a parent record was just created and its cloud id hasn't
              // landed yet — wait once, re-read fresh state, then proceed
              await new Promise((r) => setTimeout(r, 1600));
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fresh: any = (useApp.getState() as any)[LIST_KEY[table]]?.find?.((x: any) => x.id === ent.id);
              if (fresh) ent = fresh;
              if (hasTempFk(table, ent)) return; // still unresolved — keep local only
            }
            const saved = await saveToCloud(table, ent, isTempId(String(ent.id)));
            const realId = saved?.id != null ? String(saved.id) : '';
            if (realId && realId !== String(ent.id)) {
              get().replaceCloudId(table, String(ent.id), realId);
            }
            set({ lastSyncedAt: new Date().toISOString(), cloudError: '' });
          } catch (err: unknown) {
            set({ cloudError: (err as Error)?.message || 'Sync failed' });
            toast.error('Cloud sync failed', (err as Error)?.message || 'Check connection.');
          }
        })();
      },

      cloudRemove: (table, id) => {
        if (!get().authProfile || isTempId(id)) return;
        void saveDelete(table, id);
      },

      replaceCloudId: (table, tempId, realId) =>
        set((s) => {
          const fix = (id: string) => (id === tempId ? realId : id);
          const next: Partial<AppState> = {};
          if (table === 'projects') {
            next.projects = s.projects.map((p) => (p.id === tempId ? { ...p, id: realId } : p));
            next.income = s.income.map((i) => ({ ...i, projectId: fix(i.projectId) }));
            next.materials = s.materials.map((m) => ({ ...m, projectId: fix(m.projectId) }));
            next.expenses = s.expenses.map((e) => ({ ...e, projectId: fix(e.projectId) }));
            next.attendance = s.attendance.map((a) => ({ ...a, projectId: fix(a.projectId) }));
            next.vehicleLogs = s.vehicleLogs.map((l) => ({ ...l, projectId: fix(l.projectId) }));
            next.estimates = s.estimates.map((e) => ({ ...e, projectId: fix(e.projectId) }));
            next.photos = s.photos.map((p) => ({ ...p, projectId: fix(p.projectId) }));
          } else if (table === 'clients') {
            next.clients = s.clients.map((c) => (c.id === tempId ? { ...c, id: realId } : c));
            next.projects = s.projects.map((p) => ({ ...p, clientId: fix(p.clientId) }));
            next.income = s.income.map((i) => ({ ...i, clientId: fix(i.clientId) }));
            next.estimates = s.estimates.map((e) => ({ ...e, clientId: fix(e.clientId) }));
          } else if (table === 'workers') {
            next.workers = s.workers.map((w) => (w.id === tempId ? { ...w, id: realId } : w));
            next.attendance = s.attendance.map((a) => ({ ...a, workerId: fix(a.workerId) }));
            next.authProfile =
              s.authProfile?.role === 'worker' && s.authProfile.linkedId === tempId
                ? { ...s.authProfile, linkedId: realId }
                : s.authProfile;
          } else if (table === 'vehicles') {
            next.vehicles = s.vehicles.map((v) => (v.id === tempId ? { ...v, id: realId } : v));
            next.vehicleLogs = s.vehicleLogs.map((l) => ({ ...l, vehicleId: fix(l.vehicleId) }));
          } else if (table === 'attendance') {
            next.attendance = s.attendance.map((a) => (a.id === tempId ? { ...a, id: realId } : a));
          } else if (table === 'materials') {
            next.materials = s.materials.map((m) => (m.id === tempId ? { ...m, id: realId } : m));
          } else if (table === 'income') {
            next.income = s.income.map((i) => (i.id === tempId ? { ...i, id: realId } : i));
          } else if (table === 'expenses') {
            next.expenses = s.expenses.map((e) => (e.id === tempId ? { ...e, id: realId } : e));
          } else if (table === 'vehicle_logs') {
            next.vehicleLogs = s.vehicleLogs.map((l) => (l.id === tempId ? { ...l, id: realId } : l));
          } else if (table === 'site_photos') {
            next.photos = s.photos.map((p) => (p.id === tempId ? { ...p, id: realId } : p));
          }
          return next;
        }),

      // ───────── admin user ops (cloud) ─────────
      approveSignup: async (userId, link) => {
        try {
          await adminSetProfile(userId, {
            status: 'active',
            linked_worker_id: link?.kind === 'worker' ? Number(link.id) : undefined,
            linked_client_id: link?.kind === 'client' ? Number(link.id) : undefined,
          } as never);
          set((s) => ({
            profiles: s.profiles.map((p) => (p.id === userId ? {
              ...p, active: true,
              linkedId: link ? link.id : p.linkedId,
            } : p)),
          }));
          toast.success('User approved', 'They can log in now.');
        } catch (err: unknown) {
          toast.error('Approval failed', (err as Error)?.message || '');
        }
      },
      rejectSignup: async (userId) => {
        try {
          await adminSetProfile(userId, { status: 'rejected' });
          set((s) => ({ profiles: s.profiles.map((p) => (p.id === userId ? { ...p, active: false, status: 'rejected' } : p)) }));
          toast.info('Request rejected');
        } catch (err: unknown) {
          toast.error('Action failed', (err as Error)?.message || '');
        }
      },
      setUserRole: async (userId, role) => {
        try {
          await adminSetProfile(userId, { role });
          set((s) => ({ profiles: s.profiles.map((p) => (p.id === userId ? { ...p, role } : p)) }));
          toast.success('Role updated');
        } catch (err: unknown) {
          toast.error('Role update failed', (err as Error)?.message || '');
        }
      },
      setUserActive: async (userId, active) => {
        try {
          await adminSetProfile(userId, { status: active ? 'active' : 'pending' });
          set((s) => ({ profiles: s.profiles.map((p) => (p.id === userId ? { ...p, active, status: active ? 'active' : 'pending' } : p)) }));
          toast.success(active ? 'User activated' : 'User paused');
        } catch (err: unknown) {
          toast.error('Action failed', (err as Error)?.message || '');
        }
      },
      updateProfile: (userId, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === userId ? { ...p, ...patch } : p)),
          authProfile: s.authProfile?.id === userId ? { ...s.authProfile, ...patch } : s.authProfile,
        })),

      // ───────── business CRUD (optimistic + write-through) ─────────
      upsertProject: (p) => { set((s) => ({ projects: upsert(s.projects, p) })); get().cloudPush('projects', p); },
      deleteProject: (id) => { set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })); get().cloudRemove('projects', id); },
      upsertClient: (c) => { set((s) => ({ clients: upsert(s.clients, c) })); get().cloudPush('clients', c); },
      deleteClient: (id) => { set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })); get().cloudRemove('clients', id); },
      upsertWorker: (w) => { set((s) => ({ workers: upsert(s.workers, w) })); get().cloudPush('workers', w); },
      deleteWorker: (id) => {
        set((s) => ({
          workers: s.workers.filter((w) => w.id !== id),
          attendance: s.attendance.filter((a) => a.workerId !== id),
        }));
        get().cloudRemove('workers', id);
      },
      upsertMaterial: (m) => { set((s) => ({ materials: upsert(s.materials, m) })); get().cloudPush('materials', m); },
      deleteMaterial: (id) => { set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })); get().cloudRemove('materials', id); },
      upsertIncome: (i) => { set((s) => ({ income: upsert(s.income, i) })); get().cloudPush('income', i); },
      deleteIncome: (id) => { set((s) => ({ income: s.income.filter((i) => i.id !== id) })); get().cloudRemove('income', id); },
      upsertExpense: (e) => { set((s) => ({ expenses: upsert(s.expenses, e) })); get().cloudPush('expenses', e); },
      deleteExpense: (id) => { set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })); get().cloudRemove('expenses', id); },
      upsertVehicle: (v) => { set((s) => ({ vehicles: upsert(s.vehicles, v) })); get().cloudPush('vehicles', v); },
      deleteVehicle: (id) => {
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          vehicleLogs: s.vehicleLogs.filter((l) => l.vehicleId !== id),
        }));
        get().cloudRemove('vehicles', id);
      },
      upsertVehicleLog: (l) => { set((s) => ({ vehicleLogs: upsert(s.vehicleLogs, l) })); get().cloudPush('vehicle_logs', l); },
      deleteVehicleLog: (id) => { set((s) => ({ vehicleLogs: s.vehicleLogs.filter((l) => l.id !== id) })); get().cloudRemove('vehicle_logs', id); },
      upsertEstimate: (e) => set((s) => ({ estimates: upsert(s.estimates, e) })),
      deleteEstimate: (id) => set((s) => ({ estimates: s.estimates.filter((e) => e.id !== id) })),

      saveDayAttendance: (rows) => {
        set((s) => {
          const keys = new Set(rows.map((r) => `${r.date}|${r.workerId}`));
          const kept = s.attendance.filter((a) => !keys.has(`${a.date}|${a.workerId}`));
          return { attendance: [...rows, ...kept] };
        });
        const date = rows[0]?.date;
        const markedBy = get().authProfile?.name ?? 'Admin';
        if (date) {
          void replaceDayAttendance(date, rows, markedBy)
            .then(() => set({ lastSyncedAt: new Date().toISOString() }))
            .catch((err: unknown) => toast.error('Attendance sync failed', (err as Error)?.message || ''));
        }
      },
      deleteAttendance: (id) => {
        set((s) => ({ attendance: s.attendance.filter((a) => a.id !== id) }));
        get().cloudRemove('attendance', id);
      },

      // ───────── site photos ─────────
      uploadPhoto: async (file, meta, onProgress) => {
        const me = get().authProfile;
        const row = await uploadSitePhoto(
          file,
          { ...meta, uploaderId: me?.id ?? null, uploaderName: me?.name ?? 'Team' },
          onProgress,
        );
        if (row) set((s) => ({ photos: [cloudFromRow.site_photos(row), ...s.photos] }));
        toast.success('Photo published', 'Everyone on the team can see it now.');
      },
      deletePhoto: async (id) => {
        const row = get().photos.find((p) => p.id === id);
        if (!row) return;
        try {
          await deleteSitePhoto({ ...row, id: row.id });
          set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
          toast.info('Photo removed');
        } catch (err: unknown) {
          toast.error('Delete failed', (err as Error)?.message || '');
        }
      },

      // ───────── misc ─────────
      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: uid('n'), read: false, createdAt: new Date().toISOString() }, ...s.notifications].slice(0, 60),
        })),
      markNotification: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      nextEstimateNo: () => {
        const n = get().estimateCounter;
        set({ estimateCounter: n + 1 });
        return `EST-2026-${String(n).padStart(3, '0')}`;
      },
      resetDemo: () => {
        const { authProfile } = get();
        set({ ...buildSeed(), authProfile });
      },
    }),
    {
      name: 'sarvotam-store-v2',
      version: 3,
      // cloud/auth state is never persisted; business data stays as offline cache
      partialize: (s) => {
        const {
          authProfile, authChecked, cloudLoading, cloudError, lastSyncedAt,
          cloudPulled, profiles, photos, approvals,
        } = s;
        void authProfile; void authChecked; void cloudLoading; void cloudError;
        void lastSyncedAt; void cloudPulled; void profiles; void photos; void approvals;
        return s;
      },
    }
  )
);

async function saveDelete(table: CloudTable, id: string) {
  try {
    const { deleteFromCloud } = await import('../services/sync');
    await deleteFromCloud(table, id);
  } catch (err: unknown) {
    toast.error('Cloud delete failed', (err as Error)?.message || '');
  }
}

// ───────────── Toasts ─────────────

export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: string; kind: ToastKind; title: string; message?: string }

export const useToast = create<{ toasts: Toast[]; push: (kind: ToastKind, title: string, message?: string) => void; dismiss: (id: string) => void }>(
  (set) => ({
    toasts: [],
    push: (kind, title, message) => {
      const id = uid('t');
      set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, title, message }] }));
      setTimeout(() => {
        useToast.getState().dismiss(id);
      }, 3600);
    },
    dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  })
);

export const toast = {
  success: (title: string, message?: string) => useToast.getState().push('success', title, message),
  error: (title: string, message?: string) => useToast.getState().push('error', title, message),
  info: (title: string, message?: string) => useToast.getState().push('info', title, message),
  warning: (title: string, message?: string) => useToast.getState().push('warning', title, message),
};

// ───────────── Stats engine (business formulas) ─────────────

type S = SeedData;

export const dayFactor = (status: string): number =>
  status === 'Present' ? 1 : status === 'Half Day' ? 0.5 : 0;

// Labour cost = wages (rate × day factor) + advances handed out.
export function labourCost(
  s: S,
  opts: { month?: string; projectId?: string; workerId?: string } = {}
): number {
  const rateById = new Map(s.workers.map((w) => [w.id, Number(w.rate) || 0]));
  return s.attendance.reduce((sum, a) => {
    if (opts.month && monthKey(a.date) !== opts.month) return sum;
    if (opts.projectId && a.projectId !== opts.projectId) return sum;
    if (opts.workerId && a.workerId !== opts.workerId) return sum;
    return (
      sum +
      dayFactor(a.status) * (rateById.get(a.workerId) ?? 0) +
      (Number(a.advance) || 0)
    );
  }, 0);
}

export function advancesTotal(
  s: S,
  opts: { month?: string; workerId?: string; projectId?: string } = {}
): number {
  return s.attendance.reduce((sum, a) => {
    if (opts.month && monthKey(a.date) !== opts.month) return sum;
    if (opts.workerId && a.workerId !== opts.workerId) return sum;
    if (opts.projectId && a.projectId !== opts.projectId) return sum;
    return sum + (Number(a.advance) || 0);
  }, 0);
}

export function vehicleCost(s: S, opts: { month?: string; projectId?: string } = {}): number {
  const rateById = new Map(s.vehicles.map((v) => [v.id, Number(v.ratePerHour) || 0]));
  return s.vehicleLogs.reduce((sum, l) => {
    if (opts.month && monthKey(l.date) !== opts.month) return sum;
    if (opts.projectId && l.projectId !== opts.projectId) return sum;
    return (
      sum +
      Number(l.hours || 0) * (rateById.get(l.vehicleId) ?? 0) +
      Number(l.dieselLitres || 0) * Number(l.dieselRate || 0)
    );
  }, 0);
}

export interface ProjectStats {
  income: number; labour: number; material: number; expense: number; vehicle: number;
  cost: number; profit: number; pctUsed: number;
}

export function projectStats(s: S, projectId: string): ProjectStats {
  const income = s.income.filter((i) => i.projectId === projectId).reduce((x, i) => x + Number(i.amount || 0), 0);
  const labour = labourCost(s, { projectId });
  const material = s.materials.filter((m) => m.projectId === projectId).reduce((x, m) => x + Number(m.qty || 0) * Number(m.rate || 0), 0);
  const expense = s.expenses.filter((e) => e.projectId === projectId).reduce((x, e) => x + Number(e.amount || 0), 0);
  const vehicle = vehicleCost(s, { projectId });
  const cost = labour + material + expense + vehicle;
  const project = s.projects.find((p) => p.id === projectId);
  const budget = Number(project?.budget || 0);
  return { income, labour, material, expense, vehicle, cost, profit: income - cost, pctUsed: budget > 0 ? Math.round((cost / budget) * 100) : 0 };
}

export function globalTotals(s: S) {
  const income = s.income.reduce((x, i) => x + Number(i.amount || 0), 0);
  const labour = labourCost(s);
  const material = s.materials.reduce((x, m) => x + Number(m.qty || 0) * Number(m.rate || 0), 0);
  const expense = s.expenses.reduce((x, e) => x + Number(e.amount || 0), 0);
  const vehicle = vehicleCost(s);
  const cost = labour + material + expense + vehicle;
  return { income, labour, material, expense, vehicle, cost, net: income - cost };
}

export function monthlySeries(s: S, n = 6) {
  return lastNMonths(n).map((key) => {
    const income = s.income.filter((i) => monthKey(i.date) === key).reduce((x, i) => x + Number(i.amount || 0), 0);
    const labour = labourCost(s, { month: key });
    const material = s.materials.filter((m) => monthKey(m.date) === key).reduce((x, m) => x + Number(m.qty || 0) * Number(m.rate || 0), 0);
    const expense = s.expenses.filter((e) => monthKey(e.date) === key).reduce((x, e) => x + Number(e.amount || 0), 0);
    const vehicle = vehicleCost(s, { month: key });
    const cost = labour + material + expense + vehicle;
    return { key, label: monthLabel(key), income, cost, profit: income - cost };
  });
}

export function expenseByCategory(s: S) {
  const map = new Map<string, number>();
  s.expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount || 0)));
  const colors: Record<string, string> = {
    Fuel: '#e8a20c', Overhead: '#7c3aed', Equipment: '#2563eb', Transport: '#0d9488',
    Labour: '#c2491d', Food: '#0b6b4f', Safety: '#db2777', Tax: '#64748b', Miscellaneous: '#a16207',
  };
  return [...map.entries()].map(([name, value]) => ({ name, value, color: colors[name] ?? '#1b1e27' }));
}

export function workerMonthSummary(s: S, workerId: string, month: string) {
  const rows = s.attendance.filter((a) => a.workerId === workerId && monthKey(a.date) === month);
  const worker = s.workers.find((w) => w.id === workerId);
  const rate = Number(worker?.rate || 0);
  const present = rows.filter((r) => r.status === 'Present').length;
  const half = rows.filter((r) => r.status === 'Half Day').length;
  const absent = rows.filter((r) => r.status === 'Absent').length;
  const days = present + half * 0.5;
  const gross = days * rate;
  const advance = rows.reduce((x, r) => x + Number(r.advance || 0), 0);
  return { present, half, absent, days, rate, gross, advance, net: gross - advance, rows };
}

export function currentMonthKey(): string {
  return monthKey(todayISO());
}

export function sessionProfile(s: AppState): Profile | null {
  // pending / rejected accounts never unlock a portal — only active ones
  return s.authProfile?.active ? s.authProfile : null;
}
