import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConfirmProvider } from './context/ConfirmContext.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML =
    '<div style="font-family:sans-serif;padding:24px">Missing #root — check index.html.</div>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <AppErrorBoundary>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </AppErrorBoundary>
    </StrictMode>
  );
}
