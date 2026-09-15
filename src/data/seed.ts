// ─── Demo seed · Sarvotam Construction, Dahegam (Gujarat) ───
import type {
  ApprovalRequest, Attendance, BusinessSettings, Client, Estimate,
  Expense, Income, Material, Notification, Profile, Project,
  Vehicle, VehicleLog, Worker,
} from '../types';

export interface SeedData {
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
  workers: Worker[];
  attendance: Attendance[];
  materials: Material[];
  income: Income[];
  expenses: Expense[];
  vehicles: Vehicle[];
  vehicleLogs: VehicleLog[];
  estimates: Estimate[];
  notifications: Notification[];
  approvals: ApprovalRequest[];
  settings: BusinessSettings;
  estimateCounter: number;
}

const T = (d: string) => `${d}T09:30:00.000Z`;

export function buildSeed(): SeedData {
  // no demo credentials — accounts live in Supabase Auth only
  const profiles: Profile[] = [];

  const clients: Client[] = [
    { id: 'c1', name: 'Ramesh Sharma', phone: '+91 98250 11111', email: 'ramesh.sharma@gmail.com', address: 'B/h Bus Stand, Dahegam, Gandhinagar 382305', type: 'Individual', createdAt: T('2026-03-10') },
    { id: 'c2', name: 'Shree Developers', phone: '+91 98240 44444', email: 'contact@shreedev.in', address: 'S.G. Highway, Ahmedabad 380015', gst: '24ABCDE1234F1Z5', type: 'Company', createdAt: T('2026-04-22') },
    { id: 'c3', name: 'Patel Family', phone: '+91 97260 55555', email: 'patel.family@gmail.com', address: 'Motipura, Dahegam 382305', type: 'Individual', createdAt: T('2026-06-05') },
  ];

  const projects: Project[] = [
    { id: 'p1', name: 'Sharma Residence', clientId: 'c1', location: 'Dahegam', budget: 850000, startDate: '2026-05-01', endDate: '2026-12-15', status: 'Active', description: 'G+1 residential bungalow, 1800 sq.ft.', progress: 62, createdAt: T('2026-05-01') },
    { id: 'p2', name: 'City Plaza Shops', clientId: 'c2', location: 'Ahmedabad', budget: 2500000, startDate: '2026-06-10', endDate: '2027-03-30', status: 'Active', description: 'Commercial complex — 6 retail shops with parking.', progress: 34, createdAt: T('2026-06-10') },
    { id: 'p3', name: 'Farmhouse Renovation', clientId: 'c3', location: 'Dahegam', budget: 600000, startDate: '2026-07-01', endDate: '2026-11-01', status: 'On Hold', description: 'Plaster, waterproofing and full repaint.', progress: 48, createdAt: T('2026-07-01') },
    { id: 'p4', name: 'Old Office Repair', clientId: 'c1', location: 'Dahegam', budget: 320000, startDate: '2026-02-01', endDate: '2026-04-20', status: 'Completed', description: 'Office flooring, wiring and partition work.', progress: 100, createdAt: T('2026-02-01') },
  ];

  const workers: Worker[] = [
    { id: 'w1', name: 'Ramesh Kumar', phone: '+91 97230 22222', skill: 'Mason', address: 'Dahegam', aadhaar: 'XXXX-XXXX-1234', rate: 650, active: true, bankAccount: '50100234567890', ifsc: 'HDFC0001234', emergencyContact: '+91 97230 22223', createdAt: T('2026-02-14') },
    { id: 'w2', name: 'Suresh Thakor', phone: '+91 98244 66666', skill: 'Helper', address: 'Dahegam', aadhaar: 'XXXX-XXXX-5678', rate: 450, active: true, emergencyContact: '+91 98244 66667', createdAt: T('2026-02-20') },
    { id: 'w3', name: 'Arjun Patel', phone: '+91 97377 88888', skill: 'Painter', address: 'Gandhinagar', aadhaar: 'XXXX-XXXX-9012', rate: 600, active: true, emergencyContact: '+91 97377 88889', createdAt: T('2026-03-02') },
    { id: 'w4', name: 'Vikram Singh', phone: '+91 98981 77777', skill: 'Steel Fixer', address: 'Ahmedabad', aadhaar: 'XXXX-XXXX-3456', rate: 700, active: true, emergencyContact: '+91 98981 77778', createdAt: T('2026-05-11') },
    { id: 'w5', name: 'Mohan Rabari', phone: '+91 97261 99999', skill: 'Helper', address: 'Dahegam', aadhaar: 'XXXX-XXXX-7890', rate: 450, active: true, emergencyContact: '+91 97261 99998', createdAt: T('2026-06-01') },
  ];

  // ── Attendance: last 45 days, deterministic pattern ──
  const attendance: Attendance[] = [];
  const base = new Date('2026-09-07T00:00:00');
  const wids = ['w1', 'w2', 'w3', 'w4', 'w5'];
  for (let d = 44; d >= 0; d--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - d);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (dt.getDay() === 0) continue; // Sunday = weekly off
    wids.forEach((wid, wi) => {
      const seed = d * 7 + wi * 13;
      let status: Attendance['status'] = 'Present';
      if (seed % 19 === 0) status = 'Absent';
      else if (seed % 12 === 0) status = 'Half Day';
      const advance = seed % 23 === 0 ? (wi % 2 === 0 ? 1000 : 500) : 0;
      attendance.push({
        id: `a_${iso}_${wid}`,
        workerId: wid,
        projectId: wi % 2 === 0 ? 'p1' : 'p2',
        date: iso,
        status,
        advance,
        markedBy: 'Owner',
        createdAt: T(iso),
      });
    });
  }

  const materials: Material[] = [
    { id: 'm1', date: '2026-07-10', name: 'Wall Tiles (2x2)', vendor: 'Shree Ceramics', projectId: 'p1', qty: 400, unit: 'Nos', rate: 85, stockRemaining: 40, paid: true, billNumber: 'BL-2210', createdAt: T('2026-07-10') },
    { id: 'm2', date: '2026-08-05', name: 'Ultratech Cement', vendor: 'Shree Traders', projectId: 'p1', qty: 120, unit: 'Bags', rate: 380, stockRemaining: 18, paid: true, billNumber: 'BL-2401', createdAt: T('2026-08-05') },
    { id: 'm3', date: '2026-08-12', name: 'TMT Steel 12mm', vendor: 'Patel Steel', projectId: 'p2', qty: 850, unit: 'Kg', rate: 62, stockRemaining: 120, paid: false, billNumber: 'BL-2455', createdAt: T('2026-08-12') },
    { id: 'm4', date: '2026-08-25', name: 'Red Bricks (Class A)', vendor: 'Shah Bricks', projectId: 'p1', qty: 8000, unit: 'Nos', rate: 7.5, stockRemaining: 1500, paid: true, billNumber: 'BL-2512', createdAt: T('2026-08-25') },
    { id: 'm5', date: '2026-09-02', name: 'River Sand', vendor: 'Narmada Suppliers', projectId: 'p2', qty: 12, unit: 'Brass', rate: 4500, stockRemaining: 4, paid: false, billNumber: 'BL-2601', createdAt: T('2026-09-02') },
    { id: 'm6', date: '2026-09-04', name: 'Plumbing Fittings Set', vendor: 'Shree Traders', projectId: 'p1', qty: 1, unit: 'Lot', rate: 18500, stockRemaining: 0, paid: true, billNumber: 'BL-2618', createdAt: T('2026-09-04') },
  ];

  const income: Income[] = [
    { id: 'i1', date: '2026-04-12', clientId: 'c1', projectId: 'p4', work: 'Office repair — final settlement', amount: 75000, mode: 'UPI', reference: 'UPI/0412/8821', createdAt: T('2026-04-12') },
    { id: 'i2', date: '2026-05-18', clientId: 'c2', projectId: 'p2', work: 'Plaza — foundation stage advance', amount: 250000, mode: 'NEFT', reference: 'NEFT0518XA', createdAt: T('2026-05-18') },
    { id: 'i3', date: '2026-06-10', clientId: 'c1', projectId: 'p1', work: 'Residence — plinth stage', amount: 60000, mode: 'Cash', createdAt: T('2026-06-10') },
    { id: 'i4', date: '2026-07-22', clientId: 'c2', projectId: 'p2', work: 'Plaza — column stage', amount: 180000, mode: 'RTGS', reference: 'RTGS0722PQ', createdAt: T('2026-07-22') },
    { id: 'i5', date: '2026-08-14', clientId: 'c3', projectId: 'p3', work: 'Farmhouse — mobilisation advance', amount: 90000, mode: 'UPI', reference: 'UPI/0814/5512', createdAt: T('2026-08-14') },
    { id: 'i6', date: '2026-09-03', clientId: 'c1', projectId: 'p1', work: 'Residence — slab stage', amount: 70000, mode: 'UPI', reference: 'UPI/0903/9910', createdAt: T('2026-09-03') },
  ];

  const expenses: Expense[] = [
    { id: 'e1', date: '2026-04-20', description: 'Diesel for mixer + JCB', category: 'Fuel', projectId: 'p4', amount: 9200, mode: 'Cash', createdAt: T('2026-04-20') },
    { id: 'e2', date: '2026-05-11', description: 'Material transport — 3 trips', category: 'Transport', projectId: 'p1', amount: 15000, mode: 'UPI', createdAt: T('2026-05-11') },
    { id: 'e3', date: '2026-06-15', description: 'Scaffolding pipes purchase', category: 'Equipment', projectId: 'p2', amount: 22000, mode: 'Online', createdAt: T('2026-06-15') },
    { id: 'e4', date: '2026-07-08', description: 'Daily-wage helpers (4 days)', category: 'Labour', projectId: 'p2', amount: 30000, mode: 'Cash', createdAt: T('2026-07-08') },
    { id: 'e5', date: '2026-07-25', description: 'Professional tax Q1', category: 'Tax', projectId: 'p1', amount: 8000, mode: 'Online', createdAt: T('2026-07-25') },
    { id: 'e6', date: '2026-08-02', description: 'Diesel for site vehicles', category: 'Fuel', projectId: 'p1', amount: 8500, mode: 'Cash', createdAt: T('2026-08-02') },
    { id: 'e7', date: '2026-08-09', description: 'Site office rent — August', category: 'Overhead', projectId: 'p2', amount: 12000, mode: 'UPI', createdAt: T('2026-08-09') },
    { id: 'e8', date: '2026-08-20', description: 'Drill machine + tools', category: 'Equipment', projectId: 'p1', amount: 6400, mode: 'UPI', createdAt: T('2026-08-20') },
    { id: 'e9', date: '2026-08-28', description: 'Worker meals — 2 weeks', category: 'Food', projectId: 'p2', amount: 3200, mode: 'Cash', createdAt: T('2026-08-28') },
    { id: 'e10', date: '2026-09-01', description: 'Sand truck freight', category: 'Transport', projectId: 'p1', amount: 4800, mode: 'UPI', createdAt: T('2026-09-01') },
    { id: 'e11', date: '2026-09-05', description: 'Helmets, gloves & safety belts', category: 'Safety', projectId: 'p2', amount: 2600, mode: 'UPI', createdAt: T('2026-09-05') },
  ];

  const vehicles: Vehicle[] = [
    { id: 'v1', name: 'JCB 3DX Backhoe', vehicleNumber: 'GJ-18-AB-4521', type: 'JCB', ownerType: 'Hired', ratePerHour: 1100, active: true, createdAt: T('2026-05-01') },
    { id: 'v2', name: 'Concrete Mixer', vehicleNumber: 'GJ-18-C-2210', type: 'Mixer', ownerType: 'Owned', ratePerHour: 400, active: true, createdAt: T('2026-05-01') },
    { id: 'v3', name: 'Tata Truck 6-Wheel', vehicleNumber: 'GJ-01-XY-7890', type: 'Truck', ownerType: 'Rented', ratePerHour: 650, active: true, createdAt: T('2026-06-10') },
  ];

  const vehicleLogs: VehicleLog[] = [
    { id: 'vl1', vehicleId: 'v1', projectId: 'p2', date: '2026-08-28', hours: 6, dieselLitres: 42, dieselRate: 96, work: 'Foundation excavation', operatorName: 'Raju Bhai', createdAt: T('2026-08-28') },
    { id: 'vl2', vehicleId: 'v2', projectId: 'p1', date: '2026-09-01', hours: 5, dieselLitres: 18, dieselRate: 96, work: 'Slab concreting', operatorName: 'Mohan', createdAt: T('2026-09-01') },
    { id: 'vl3', vehicleId: 'v1', projectId: 'p2', date: '2026-09-03', hours: 4, dieselLitres: 28, dieselRate: 96, work: 'Backfilling', operatorName: 'Raju Bhai', createdAt: T('2026-09-03') },
    { id: 'vl4', vehicleId: 'v3', projectId: 'p1', date: '2026-09-05', hours: 3, dieselLitres: 22, dieselRate: 96, work: 'Sand delivery — 2 trips', operatorName: 'Ismail', createdAt: T('2026-09-05') },
  ];

  const estimates: Estimate[] = [
    {
      id: 'es1', estimateNo: 'EST-2026-014', clientId: 'c1', projectId: 'p1',
      title: 'Ground Floor Extension — 400 sq.ft.',
      items: [
        { name: 'RCC work with steel & shuttering', qty: 400, unit: 'Sq.ft', rate: 260, amount: 104000 },
        { name: 'Brickwork 9-inch', qty: 900, unit: 'Sq.ft', rate: 95, amount: 85500 },
        { name: 'Plaster + putty + paint', qty: 1400, unit: 'Sq.ft', rate: 68, amount: 95200 },
      ],
      subtotal: 284700, gstPercent: 18, gstAmount: 51246, total: 335946,
      status: 'Sent', validUntil: '2026-10-07', note: 'Payment in 3 stages. Material brand as approved.',
      createdAt: T('2026-09-02'),
    },
    {
      id: 'es2', estimateNo: 'EST-2026-013', clientId: 'c3', projectId: 'p3',
      title: 'Farmhouse Plaster & Waterproofing',
      items: [
        { name: 'External plaster with waterproof coat', qty: 2200, unit: 'Sq.ft', rate: 55, amount: 121000 },
        { name: 'Terrace waterproofing (5-yr warranty)', qty: 1800, unit: 'Sq.ft', rate: 90, amount: 162000 },
      ],
      subtotal: 283000, gstPercent: 18, gstAmount: 50940, total: 333940,
      status: 'Approved', validUntil: '2026-09-30', createdAt: T('2026-08-20'),
    },
    {
      id: 'es3', estimateNo: 'EST-2026-015', clientId: 'c2', projectId: 'p2',
      title: 'Shop Interiors — Electrical & Flooring',
      items: [
        { name: 'Vitrified flooring with labour', qty: 1200, unit: 'Sq.ft', rate: 145, amount: 174000 },
        { name: 'Electrical points & DB work', qty: 60, unit: 'Nos', rate: 850, amount: 51000 },
      ],
      subtotal: 225000, gstPercent: 18, gstAmount: 40500, total: 265500,
      status: 'Draft', validUntil: '2026-10-15', createdAt: T('2026-09-05'),
    },
  ];

  const notifications: Notification[] = [
    { id: 'n2', title: 'Unpaid material bill', message: 'TMT Steel bill BL-2455 (₹52,700) is still unpaid.', read: false, type: 'warning', createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString() },
    { id: 'n3', title: 'Estimate approved', message: 'Patel Family approved EST-2026-013.', read: false, type: 'success', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: 'n4', title: 'Budget alert', message: 'City Plaza Shops has used 81% of its budget.', read: true, type: 'error', createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  ];

  const approvals: ApprovalRequest[] = [];

  const settings: BusinessSettings = {
    businessName: 'Sarvotam Construction',
    ownerName: 'Sarvotam Owner',
    address: 'Station Road, Dahegam, Dist. Gandhinagar, Gujarat 382305',
    phone: '+91 98765 43210',
    email: 'contact@sarvotamconstruction.in',
    gst: '24ABCDE5678G1Z2',
    terms: '1. Payment as per stage completion.\n2. Material rates valid for 30 days.\n3. Extra work will be billed separately.\n4. Warranty as per workmanship terms.',
    notifySignup: true,
    notifyAttendance: true,
    notifyStock: true,
    notifyBudget: true,
  };

  return {
    profiles, clients, projects, workers, attendance, materials, income,
    expenses, vehicles, vehicleLogs, estimates, notifications, approvals,
    settings, estimateCounter: 16,
  };
}
