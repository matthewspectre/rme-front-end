import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DWLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const base = 'Data Warehouse RME-LINK'
    const p = location.pathname || ''
    let suffix = ''
    if (p === '/dw-dashboard' || p === '/dw') suffix = ' - Dashboard'
    else if (p === '/dw/poli-umum') suffix = ' - Poli Umum'
    else if (p === '/dw/poli-penyakit-dalam') suffix = ' - Poli Penyakit Dalam'
    else if (p === '/dw/poli-bedah') suffix = ' - Poli Bedah'
    document.title = base + suffix
  }, [location.pathname])

  return (
    <div className="doctor-dashboard">
      <aside className="doctor-sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">DW</div>
          <div className="logo-text">
            <div className="logo-title">Data Warehouse RME-LINK</div>
            <div className="logo-subtitle">Rekam Medis Elektronik</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-item ${isActive('/dw-dashboard') ? 'active' : ''}`} onClick={() => navigate('/dw-dashboard')}>
            <span className="sidebar-icon">🏠</span>
            <span>Dashboard Utama</span>
          </button>

          <button className={`sidebar-item ${(isActive('/dw/poli-umum') || isActive('/dw/poli-penyakit-dalam') || isActive('/dw/poli-bedah')) ? 'active' : ''}`} onClick={() => {}}>
            <span className="sidebar-icon">🩺</span>
            <span>Poli</span>
          </button>

          <button className={`sidebar-item ${isActive('/dw/poli-umum') ? 'active' : ''}`} onClick={() => navigate('/dw/poli-umum')}>
            <span className="sidebar-icon">🏥</span>
            <span>Poli Umum</span>
          </button>

          <button className={`sidebar-item ${isActive('/dw/poli-penyakit-dalam') ? 'active' : ''}`} onClick={() => navigate('/dw/poli-penyakit-dalam')}>
            <span className="sidebar-icon">🩺</span>
            <span>Poli Penyakit Dalam</span>
          </button>

          <button className={`sidebar-item ${isActive('/dw/poli-bedah') ? 'active' : ''}`} onClick={() => navigate('/dw/poli-bedah')}>
            <span className="sidebar-icon">🔧</span>
            <span>Poli Bedah</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="sidebar-item" onClick={() => { localStorage.removeItem('dw_user'); navigate('/dw-login') }}>
            <span className="sidebar-icon">↩️</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="doctor-main">
        {children}
      </main>
    </div>
  )
}
