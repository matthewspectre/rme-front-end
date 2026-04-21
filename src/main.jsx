import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// capture global errors and unhandled promise rejections so we can inspect after a reload
window.addEventListener('error', (ev) => {
  try {
    const payload = {
      type: 'error',
      message: ev.message || String(ev.error || ev).slice(0, 200),
      stack: ev.error && ev.error.stack ? ev.error.stack : null,
      time: new Date().toISOString()
    }
    localStorage.setItem('lastAppError', JSON.stringify(payload))
    console.error('Captured global error', payload)
  } catch (e) {
    // ignore
  }
})

window.addEventListener('unhandledrejection', (ev) => {
  try {
    const reason = ev.reason
    const payload = {
      type: 'unhandledrejection',
      message: (reason && reason.message) ? reason.message : String(reason).slice(0,200),
      stack: reason && reason.stack ? reason.stack : null,
      time: new Date().toISOString()
    }
    localStorage.setItem('lastAppError', JSON.stringify(payload))
    console.error('Captured unhandledrejection', payload)
  } catch (e) {
    // ignore
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
