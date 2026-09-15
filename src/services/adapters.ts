// ─── Adapters · English UI entities ↔ SQL columns · validation (prod schema) ───
// Mirrors the original REQUIRED-field guard + number coercion + "" → null.
import type {
  Attendance, Client, Expense, Income, Material, Project, SitePhoto, Vehicle, VehicleLog, Worker,
} from '../types';

export type CloudTable =
  | 'clients' | 'projects' | 'workers' | 'attendance' | 'materials'
  | 'income' | 'expenses' | 'vehicles' | 'vehicle_logs' | 'site_photos';

export const CLOUD_TABLES: CloudTable[] = [
  'clients', 'projects', 'workers', 'attendance', 'materials',
  'income', 'expenses', 'vehicles', 'vehicle_logs', 'site_photos',
];

export const REQUIRED: Record<CloudTable, string[]> = {
  clients: ['name'],
  projects: ['name'],
  workers: ['name'],
  attendance: ['worker_id', 'date', 'status'],
  materials: ['date', 'name'],
  income: ['date'],
  expenses: ['date', 'description'],
  vehicles: ['name'],
  vehicle_logs: ['vehicle_id', 'date'],
  site_photos: ['file_path'],
};

const num = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const n = (v: unknown) => (v === '' || v === null || v === undefined ? null : v);
export const isTempId = (id: string) => !/^\d+$/.test(id);
const fk = (v: unknown) => {
  const s = str(v);
  return /^\d+$/.test(s) ? Number(s) : null;
};

// temp local ids can't be sent as FKs
const FK_FIELDS: Partial<Record<CloudTable, string[]>> = {
  projects: ['client_id'],
  attendance: ['worker_id', 'project_id'],
  materials: ['project_id'],
  income: ['client_id', 'project_id'],
  expenses: ['project_id'],
  vehicle_logs: ['vehicle_id', 'project_id'],
  site_photos: ['project_id'],
};
export function hasTempFk(table: CloudTable, entity: unknown): boolean {
  const e = entity as Record<string, unknown>;
  return (FK_FIELDS[table] ?? []).some((f) => {
    const val = e[f] ?? e[snakeToCamel(f)];
    return typeof val === 'string' && val !== '' && isTempId(val);
  });
}
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

type AnyRec = Record<string, unknown>;

const toRow: Record<CloudTable, (e: AnyRec) => AnyRec> = {
  clients: (e) => ({
    name: e.name, phone: e.phone, email: e.email, address: e.address,
    gst: e.gst, type: e.type,
  }),
  projects: (e) => ({
    name: e.name, client_id: fk(e.clientId), location: e.location, budget: num(e.budget),
    start_date: n(e.startDate), end_date: n(e.endDate), status: e.status,
    description: e.description, progress: num(e.progress),
  }),
  workers: (e) => ({
    name: e.name, phone: e.phone, role: e.skill, address: e.address, aadhaar: e.aadhaar,
    daily_rate: num(e.rate), status: e.active === false ? 'Inactive' : 'Active',
    bank_account: e.bankAccount, ifsc: e.ifsc, emergency_contact: e.emergencyContact,
    photo_url: e.photoUrl,
  }),
  attendance: (e) => ({
    worker_id: fk(e.workerId), project_id: fk(e.projectId), date: e.date, status: e.status,
    advance: num(e.advance), note: e.note, marked_by: e.markedBy,
  }),
  materials: (e) => ({
    date: e.date, name: e.name, vendor: e.vendor, project_id: fk(e.projectId),
    qty: num(e.qty), unit: e.unit, rate: num(e.rate), stock_remaining: num(e.stockRemaining),
    bill_number: e.billNumber, paid: Boolean(e.paid),
  }),
  income: (e) => ({
    date: e.date, client_id: fk(e.clientId), project_id: fk(e.projectId), work: e.work,
    amount: num(e.amount), mode: e.mode, reference: e.reference, note: e.note,
  }),
  expenses: (e) => ({
    date: e.date, description: e.description, category: e.category,
    project_id: fk(e.projectId), amount: num(e.amount), mode: e.mode,
  }),
  vehicles: (e) => ({
    name: e.name, vehicle_number: e.vehicleNumber, type: e.type, owner_type: e.ownerType,
    rate_per_hour: num(e.ratePerHour), status: e.active === false ? 'Inactive' : 'Active',
  }),
  vehicle_logs: (e) => ({
    vehicle_id: fk(e.vehicleId), project_id: fk(e.projectId), date: e.date,
    hours: num(e.hours), diesel_litres: num(e.dieselLitres), diesel_rate: num(e.dieselRate),
    work: e.work, operator_name: e.operatorName,
  }),
  site_photos: (e) => ({
    project_id: fk(e.projectId), title: e.title, note: e.note, date: e.date,
    file_path: e.filePath, file_url: e.fileUrl, uploader_id: e.uploaderId,
    uploader_name: e.uploaderName,
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const fromRow: Record<CloudTable, (r: Row) => AnyRec> = {
  clients: (r) => ({
    id: String(r.id), name: r.name, phone: r.phone ?? '', email: r.email ?? '',
    address: r.address ?? '', gst: r.gst ?? '', type: r.type ?? 'Individual',
    createdAt: r.created_at ?? '',
  }),
  projects: (r) => ({
    id: String(r.id), name: r.name, clientId: r.client_id != null ? String(r.client_id) : '',
    location: r.location ?? '', budget: num(r.budget),
    startDate: r.start_date ?? '', endDate: r.end_date ?? '',
    status: r.status ?? 'Active', description: r.description ?? '',
    progress: num(r.progress), createdAt: r.created_at ?? '',
  }),
  workers: (r) => ({
    id: String(r.id), name: r.name, phone: r.phone ?? '', skill: r.role ?? 'Helper',
    address: r.address ?? '', aadhaar: r.aadhaar ?? '', rate: num(r.daily_rate),
    active: r.status !== 'Inactive', bankAccount: r.bank_account ?? '',
    ifsc: r.ifsc ?? '', emergencyContact: r.emergency_contact ?? '',
    photoUrl: r.photo_url ?? '', createdAt: r.created_at ?? '',
  }),
  attendance: (r) => ({
    id: String(r.id), workerId: r.worker_id != null ? String(r.worker_id) : '',
    projectId: r.project_id != null ? String(r.project_id) : '',
    date: r.date, status: r.status ?? 'Present', advance: num(r.advance),
    note: r.note ?? '', markedBy: r.marked_by ?? '', createdAt: r.created_at ?? '',
  }),
  materials: (r) => ({
    id: String(r.id), date: r.date, name: r.name, vendor: r.vendor ?? '',
    projectId: r.project_id != null ? String(r.project_id) : '',
    qty: num(r.qty), unit: r.unit ?? 'Nos', rate: num(r.rate),
    stockRemaining: num(r.stock_remaining), paid: Boolean(r.paid),
    billNumber: r.bill_number ?? '', createdAt: r.created_at ?? '',
  }),
  income: (r) => ({
    id: String(r.id), date: r.date,
    clientId: r.client_id != null ? String(r.client_id) : '',
    projectId: r.project_id != null ? String(r.project_id) : '',
    work: r.work ?? '', amount: num(r.amount), mode: r.mode ?? 'Cash',
    reference: r.reference ?? '', note: r.note ?? '', createdAt: r.created_at ?? '',
  }),
  expenses: (r) => ({
    id: String(r.id), date: r.date, description: r.description,
    category: r.category ?? 'Miscellaneous',
    projectId: r.project_id != null ? String(r.project_id) : '',
    amount: num(r.amount), mode: r.mode ?? 'Cash', createdAt: r.created_at ?? '',
  }),
  vehicles: (r) => ({
    id: String(r.id), name: r.name, vehicleNumber: r.vehicle_number ?? '',
    type: r.type ?? 'JCB', ownerType: r.owner_type ?? 'Owned',
    ratePerHour: num(r.rate_per_hour), active: r.status !== 'Inactive',
    createdAt: r.created_at ?? '',
  }),
  vehicle_logs: (r) => ({
    id: String(r.id),
    vehicleId: r.vehicle_id != null ? String(r.vehicle_id) : '',
    projectId: r.project_id != null ? String(r.project_id) : '',
    date: r.date, hours: num(r.hours), dieselLitres: num(r.diesel_litres),
    dieselRate: num(r.diesel_rate), work: r.work ?? '',
    operatorName: r.operator_name ?? '', createdAt: r.created_at ?? '',
  }),
  site_photos: (r) => ({
    id: String(r.id),
    projectId: r.project_id != null ? String(r.project_id) : '',
    title: r.title ?? '', note: r.note ?? '', date: r.date,
    filePath: r.file_path, fileUrl: r.file_url ?? '',
    uploaderId: r.uploader_id ?? '', uploaderName: r.uploader_name ?? '',
    createdAt: r.created_at ?? '',
  }),
};

/** Validate + convert a UI entity to a cloud row (original save logic). */
export function sanitize(table: CloudTable, entity: unknown): AnyRec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = entity as any;
  const row = toRow[table](e);
  for (const key of REQUIRED[table]) {
    const v = row[key];
    if (v === null || v === undefined || String(v).trim() === '') {
      throw new Error(`${key.replace(/_/g, ' ')} is required`);
    }
  }
  Object.keys(row).forEach((k) => {
    if (row[k] === '') row[k] = null;
  });
  return row;
}

// ─── entity type helpers so the store keeps its existing names ───
export const cloudFromRow = {
  clients: (r: Row) => fromRow.clients(r) as unknown as Client,
  projects: (r: Row) => fromRow.projects(r) as unknown as Project,
  workers: (r: Row) => fromRow.workers(r) as unknown as Worker,
  attendance: (r: Row) => fromRow.attendance(r) as unknown as Attendance,
  materials: (r: Row) => fromRow.materials(r) as unknown as Material,
  income: (r: Row) => fromRow.income(r) as unknown as Income,
  expenses: (r: Row) => fromRow.expenses(r) as unknown as Expense,
  vehicles: (r: Row) => fromRow.vehicles(r) as unknown as Vehicle,
  vehicle_logs: (r: Row) => fromRow.vehicle_logs(r) as unknown as VehicleLog,
  site_photos: (r: Row) => fromRow.site_photos(r) as unknown as SitePhoto,
};
