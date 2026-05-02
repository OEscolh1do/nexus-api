import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import App from './App';
import './index.css';

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3301',
  appId: import.meta.env.VITE_LOGTO_APP_ID || '',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogtoProvider config={logtoConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LogtoProvider>
  </StrictMode>
);
