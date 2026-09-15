import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Any uncaught error now shows a dismissible card instead of a mystery blank page.
function showCrash(msg: string) {
  if (document.getElementById('sf-err')) return;
  const box = document.createElement('div');
  box.id = 'sf-err';
  box.setAttribute(
    'style',
    'position:fixed;right:16px;bottom:16px;z-index:9999;max-width:360px;background:#C2491D;color:#fff;' +
    'padding:14px 40px 14px 16px;border-radius:16px;font:600 12.5px/1.5 system-ui;box-shadow:0 12px 40px rgba(0,0,0,.35)',
  );
  box.textContent = 'Page error (safe to screenshot): ' + msg;
  const x = document.createElement('button');
  x.textContent = '✕';
  x.setAttribute('style', 'position:absolute;top:8px;right:10px;background:none;border:0;color:#fff;font-size:14px;cursor:pointer');
  x.onclick = () => box.remove();
  box.appendChild(x);
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 45000);
}
window.addEventListener('error', (e) => showCrash(e.message || 'Unknown error'));
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason as { message?: string } | string | undefined;
  showCrash(typeof r === 'string' ? r : (r?.message ?? 'Async error'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
