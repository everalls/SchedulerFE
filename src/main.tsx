import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CssBaseline } from '@mui/material'
import { AppointmentsProvider } from './context/AppointmentsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssBaseline />
    <AppointmentsProvider>
      <App />
    </AppointmentsProvider>
  </React.StrictMode>
)
