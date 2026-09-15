// ─── Sarvotam Construction · shared domain types (Supabase-ready) ───

export type Role = 'admin' | 'staff' | 'client' | 'worker' | 'supervisor';

export interface Profile {
  id: string;
  name: string;
  email: string;
  password?: string; // never used with cloud auth — kept type-only for local dev
  phone?: string;
  role: Role;
  linkedId?: string; // clients.id or workers.id
  active: boolean;
  status?: 'pending' | 'active' | 'rejected';
  avatar?: string;
  createdAt: string;
}

export interface SitePhoto {
  id: string;
  projectId: string;
  title: string;
  note: string;
  date: string;
  filePath: string;
  fileUrl: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gst?: string;
  type: 'Individual' | 'Company' | 'Government';
  createdAt: string;
}

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  location?: string;
  budget: number;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  description?: string;
  progress: number; // 0-100
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  skill: string;
  address?: string;
  aadhaar?: string;
  rate: number; // daily rate
  active: boolean;
  bankAccount?: string;
  ifsc?: string;
  emergencyContact?: string;
  photoUrl?: string;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Half Day' | 'Absent' | 'Holiday';

export interface Attendance {
  id: string;
  workerId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  advance: number;
  note?: string;
  markedBy?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  date: string;
  name: string;
  vendor?: string;
  projectId: string;
  qty: number;
  unit: string;
  rate: number;
  stockRemaining: number;
  paid: boolean;
  billNumber?: string;
  createdAt: string;
}

export type IncomeMode = 'Cash' | 'Cheque' | 'NEFT' | 'UPI' | 'RTGS' | 'Online';

export interface Income {
  id: string;
  date: string;
  clientId: string;
  projectId: string;
  work?: string;
  amount: number;
  mode: IncomeMode;
  reference?: string;
  note?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Fuel' | 'Overhead' | 'Equipment' | 'Transport'
  | 'Labour' | 'Food' | 'Safety' | 'Tax' | 'Miscellaneous';

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  projectId: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Online' | 'Cheque';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  vehicleNumber?: string;
  type: 'JCB' | 'Excavator' | 'Truck' | 'Mixer' | 'Crane' | 'Roller' | 'Other';
  ownerType: 'Owned' | 'Hired' | 'Rented';
  ratePerHour: number;
  active: boolean;
  createdAt: string;
}

export interface VehicleLog {
  id: string;
  vehicleId: string;
  projectId: string;
  date: string;
  hours: number;
  dieselLitres: number;
  dieselRate: number;
  work?: string;
  operatorName?: string;
  createdAt: string;
}

export interface EstimateItem {
  name: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export type EstimateStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';

export interface Estimate {
  id: string;
  estimateNo: string;
  clientId: string;
  projectId: string;
  title: string;
  items: EstimateItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
  status: EstimateStatus;
  validUntil?: string;
  note?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string; // undefined = broadcast to admins
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email: string;
  role: Role;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  terms: string;
  notifySignup: boolean;
  notifyAttendance: boolean;
  notifyStock: boolean;
  notifyBudget: boolean;
}
