import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ServerDownProvider } from './components/context/ServerDownContext.jsx'
import ServerStatusBridge from './ServerStatusBridge.jsx'
import { AuthProvider } from './components/context/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ServerDownProvider>
      <ServerStatusBridge />
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ServerDownProvider>
  </StrictMode>,
)
