import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3301',
  appId: import.meta.env.VITE_LOGTO_APP_ID || '',
  scopes: ['openid', 'profile', 'email', 'offline_access', 'roles'],
  resources: ['https://api.ywara.com.br'],
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LogtoProvider config={logtoConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LogtoProvider>
  </React.StrictMode>
);
