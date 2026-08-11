import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Only run in browser environment
if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    if (import.meta.env.DEV && window.location.pathname === '/admin') {
      void import('./components/admin/LocalAdminPage').then(({ LocalAdminPage }) => {
        root.render(<AuthProvider><LocalAdminPage /></AuthProvider>);
      });
    } else {
      root.render(<App />);
    }
  }
}
