// ─── Sarvotam Construction · router + role guards ───
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminLayout, PortalLayout, clientTabs, supervisorTabs, workerTabs } from './components/layout';
import { Logo, Skeleton, Toasts } from './components/ui';
import type { Role } from './types';
import { sessionProfile, useApp } from './store/appStore';

// lazy pages
const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.Login })));
const Setup = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.Setup })));
const Signup = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.Signup })));
const Pending = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.Pending })));
const Forgot = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.Forgot })));
const ResetPassword = lazy(() => import('./pages/public/Auth').then((m) => ({ default: m.ResetPassword })));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProjectsPage = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.ProjectsPage })));
const ClientsPage = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.ClientsPage })));
const WorkersPage = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.WorkersPage })));
const AttendancePage = lazy(() => import('./pages/admin/Site').then((m) => ({ default: m.AttendancePage })));
const MaterialsPage = lazy(() => import('./pages/admin/Site').then((m) => ({ default: m.MaterialsPage })));
const VehiclesPage = lazy(() => import('./pages/admin/Site').then((m) => ({ default: m.VehiclesPage })));
const IncomePage = lazy(() => import('./pages/admin/Finance').then((m) => ({ default: m.IncomePage })));
const ExpensesPage = lazy(() => import('./pages/admin/Finance').then((m) => ({ default: m.ExpensesPage })));
const EstimatesPage = lazy(() => import('./pages/admin/Finance').then((m) => ({ default: m.EstimatesPage })));
const ReportsPage = lazy(() => import('./pages/admin/System').then((m) => ({ default: m.ReportsPage })));
const PhotosPage = lazy(() => import('./pages/shared/PhotosBoard').then((m) => ({ default: m.AdminPhotosPage })));
const ClientPhotosPage = lazy(() => import('./pages/shared/PhotosBoard').then((m) => ({ default: m.ClientPhotosPage })));
const SupervisorPhotosPage = lazy(() => import('./pages/shared/PhotosBoard').then((m) => ({ default: m.SupervisorPhotosPage })));
const UsersPage = lazy(() => import('./pages/admin/System').then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/admin/System').then((m) => ({ default: m.SettingsPage })));

const ClientDashboard = lazy(() => import('./pages/client/ClientPages').then((m) => ({ default: m.ClientDashboard })));
const ClientEstimates = lazy(() => import('./pages/client/ClientPages').then((m) => ({ default: m.ClientEstimates })));
const ClientProjects = lazy(() => import('./pages/client/ClientPages').then((m) => ({ default: m.ClientProjects })));
const ClientPayments = lazy(() => import('./pages/client/ClientPages').then((m) => ({ default: m.ClientPayments })));
const ClientProfile = lazy(() => import('./pages/client/ClientPages').then((m) => ({ default: m.ClientProfile })));

const WorkerDashboard = lazy(() => import('./pages/worker/WorkerPages').then((m) => ({ default: m.WorkerDashboard })));
const WorkerAttendance = lazy(() => import('./pages/worker/WorkerPages').then((m) => ({ default: m.WorkerAttendance })));
const WorkerEarnings = lazy(() => import('./pages/worker/WorkerPages').then((m) => ({ default: m.WorkerEarnings })));
const WorkerProfile = lazy(() => import('./pages/worker/WorkerPages').then((m) => ({ default: m.WorkerProfile })));

const SupervisorDashboard = lazy(() => import('./pages/supervisor/SupervisorPages').then((m) => ({ default: m.SupervisorDashboard })));
const SupervisorAttendance = lazy(() => import('./pages/supervisor/SupervisorPages').then((m) => ({ default: m.SupervisorAttendance })));
const SupervisorMaterials = lazy(() => import('./pages/supervisor/SupervisorPages').then((m) => ({ default: m.SupervisorMaterials })));

const homeFor = (role: Role): string =>
  role === 'admin' || role === 'staff' ? '/admin/dashboard'
  : role === 'client' ? '/client/dashboard'
  : role === 'worker' ? '/worker/dashboard'
  : '/supervisor/dashboard';

function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const me = useApp(sessionProfile);
  const checked = useApp((s) => s.authChecked);
  const location = useLocation();
  if (!checked) return <Loading />;
  if (!me) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(me.role)) return <Navigate to={homeFor(me.role)} replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const me = useApp(sessionProfile);
  const checked = useApp((s) => s.authChecked);
  if (!checked) return <Loading />;
  if (me) return <Navigate to={homeFor(me.role)} replace />;
  return <>{children}</>;
}

/** Restore the Supabase session, pull live data and subscribe to realtime. */
function CloudBootstrap() {
  useEffect(() => {
    // successful mount → clear the one-shot reload guard
    sessionStorage.removeItem('chunk-reloaded');
    useApp.getState().bootstrapAuth();
    useApp.getState().checkSchema();
  }, []);
  return null;
}

/** Admin-only screens (Owner). Staff sees everything else in /admin. */
function RequireAdminOnly({ children }: { children: ReactNode }) {
  const me = useApp(sessionProfile);
  if (me && me.role !== 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="mt-3 h-40" />
        <p className="mt-4 animate-pulse text-center text-sm font-bold text-ink/45">Loading your workspace…</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="text-center">
        <div className="font-display text-7xl font-bold text-ink/10">404</div>
        <h1 className="font-display mt-2 text-2xl font-bold">This page walked off the site.</h1>
        <p className="mt-2 text-sm font-medium text-ink/55">The link you followed doesn't exist.</p>
        <a href="/" className="mt-5 inline-block rounded-2xl bg-night px-6 py-3 text-sm font-extrabold text-white">Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CloudBootstrap />
      <Toasts />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/forgot" element={<PublicOnly><Forgot /></PublicOnly>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup" element={<Setup />} />

          {/* admin */}
          <Route path="/admin" element={<RequireRole roles={['admin', 'staff']}><AdminLayout /></RequireRole>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="estimates" element={<EstimatesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="photos" element={<PhotosPage />} />
            <Route path="users" element={<RequireAdminOnly><UsersPage /></RequireAdminOnly>} />
            <Route path="settings" element={<RequireAdminOnly><SettingsPage /></RequireAdminOnly>} />
          </Route>

          {/* client */}
          <Route path="/client" element={<RequireRole roles={['client']}><PortalLayout tabs={clientTabs} /></RequireRole>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="estimates" element={<ClientEstimates />} />
            <Route path="projects" element={<ClientProjects />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="photos" element={<ClientPhotosPage />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* worker */}
          <Route path="/worker" element={<RequireRole roles={['worker']}><PortalLayout tabs={workerTabs} accent="bg-forest" /></RequireRole>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="attendance" element={<WorkerAttendance />} />
            <Route path="earnings" element={<WorkerEarnings />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>

          {/* supervisor */}
          <Route path="/supervisor" element={<RequireRole roles={['supervisor']}><PortalLayout tabs={supervisorTabs} accent="bg-plum" /></RequireRole>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SupervisorDashboard />} />
            <Route path="attendance" element={<SupervisorAttendance />} />
            <Route path="materials" element={<SupervisorMaterials />} />
            <Route path="photos" element={<SupervisorPhotosPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
