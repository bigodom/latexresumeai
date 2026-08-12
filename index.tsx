import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Only run in browser environment
if (typeof document !== 'undefined') {
  const isLocalDevelopment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  if (window.location.protocol === 'http:' && !isLocalDevelopment) {
    const secureUrl = new URL(window.location.href);
    secureUrl.protocol = 'https:';
    window.location.replace(secureUrl);
  } else {
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  }
}
