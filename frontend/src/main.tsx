import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './context/Toast';
import { ConfirmProvider } from './context/Confirm';
import { AuthProvider } from './context/Auth';
import { ShopProvider } from './context/Shop';
import { StaffProvider } from './context/Staff';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
        <AuthProvider>
          <ShopProvider>
            <StaffProvider>
              <App />
            </StaffProvider>
          </ShopProvider>
        </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
