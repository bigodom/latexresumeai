import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Only run in browser environment
if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
}