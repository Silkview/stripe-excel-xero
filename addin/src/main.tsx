import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

Office.onReady(() => {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </React.StrictMode>
    );
  }
});
