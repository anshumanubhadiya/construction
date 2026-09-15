// ─── Mount-crash smoke test · pages must render without infinite loops ───
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  (window as unknown as { matchMedia: unknown }).matchMedia ??= (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {},
  });
  (globalThis as Record<string, unknown>).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  (globalThis as Record<string, unknown>).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true, status: 200, json: async () => [], text: async () => '', headers: new Headers(),
  })));
});

async function mount(node: ReactElement) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { root.render(node); });
  await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
  const text = el.textContent || '';
  await act(async () => { root.unmount(); });
  el.remove();
  return text;
}

const me = (role: string, linkedId?: string) => ({
  id: 'u1', name: 'Test User', email: 't@t.com', phone: '', role,
  active: true, status: 'active' as const, linkedId, createdAt: '2026-01-01',
});

describe('previously-crashing pages', () => {
  it('admin Workers page renders', async () => {
    const { useApp } = await import('../src/store/appStore');
    useApp.setState({ authProfile: me('admin') as never });
    const { WorkersPage } = await import('../src/pages/admin/Manage');
    const text = await mount(<MemoryRouter><WorkersPage /></MemoryRouter>);
    expect(text).toContain('Workers');
    expect(text.length).toBeGreaterThan(80);
  });

  it('admin Clients page renders', async () => {
    const { ClientsPage } = await import('../src/pages/admin/Manage');
    const text = await mount(<MemoryRouter><ClientsPage /></MemoryRouter>);
    expect(text).toContain('Clients');
  });

  it('worker Dashboard renders with linked worker', async () => {
    const { useApp } = await import('../src/store/appStore');
    useApp.setState({ authProfile: me('worker', 'w1') as never });
    const { WorkerDashboard } = await import('../src/pages/worker/WorkerPages');
    const text = await mount(<MemoryRouter><WorkerDashboard /></MemoryRouter>);
    expect(text).toContain('Days worked');
    expect(text).not.toContain('Account not linked');
  });

  it('worker Attendance + Earnings render', async () => {
    const { WorkerAttendance, WorkerEarnings } = await import('../src/pages/worker/WorkerPages');
    expect(await mount(<MemoryRouter><WorkerAttendance /></MemoryRouter>)).toContain('My Attendance');
    expect(await mount(<MemoryRouter><WorkerEarnings /></MemoryRouter>)).toContain('Earnings');
  });

  it('client portal pages render', async () => {
    const { useApp } = await import('../src/store/appStore');
    useApp.setState({ authProfile: me('client', 'c1') as never });
    const c = await import('../src/pages/client/ClientPages');
    expect(await mount(<MemoryRouter><c.ClientDashboard /></MemoryRouter>)).toContain('Welcome');
    expect(await mount(<MemoryRouter><c.ClientPayments /></MemoryRouter>)).toContain('Payments');
  });

  it('supervisor pages render', async () => {
    const { useApp } = await import('../src/store/appStore');
    useApp.setState({ authProfile: me('supervisor') as never });
    const sp = await import('../src/pages/supervisor/SupervisorPages');
    expect(await mount(<MemoryRouter><sp.SupervisorDashboard /></MemoryRouter>)).toContain('Hello');
    expect(await mount(<MemoryRouter><sp.SupervisorAttendance /></MemoryRouter>)).toContain('Attendance');
  });

  it('admin Attendance (Site) page renders', async () => {
    const { AttendancePage } = await import('../src/pages/admin/Site');
    expect(await mount(<MemoryRouter><AttendancePage /></MemoryRouter>)).toContain('Attendance');
  });
});
