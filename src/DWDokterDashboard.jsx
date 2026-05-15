import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DWLayout from './dw/DWLayout'

function DWDokterDashboard() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const raw = localStorage.getItem('dw_user')
    if (!raw) {
      navigate('/dw-login')
      return
    }
    try {
      const u = JSON.parse(raw)
      const isAdmin = (u?.role === 'dw_admin') || (u?.username === 'admin')
      if (isAdmin) {
        navigate('/dw-dashboard')
      }
    } catch (e) {
      navigate('/dw-login')
    }
  }, [navigate])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      const el = menuRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const handleLogoutToRme = () => {
    try { localStorage.removeItem('dw_user') } catch (e) {}
    setMenuOpen(false)
    navigate('/')
  }

  let displayName = 'Dokter DW'
  let initials = 'DW'
  try {
    const raw = localStorage.getItem('dw_user')
    const u = raw ? JSON.parse(raw) : null
    const uname = String(u?.username || '').trim()
    if (uname) {
      displayName = uname
      initials = uname
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }
  } catch (e) {}

  return (
    <DWLayout>
      <div className="doctor-header">
        <div>
          <h1 className="doctor-title">Data Warehouse RME-LINK - Dashboard Dokter</h1>
          <p className="doctor-date">{new Date().toLocaleString()}</p>
        </div>

        <div className="doctor-profile-wrapper">
          <div ref={menuRef}>
            <button
              type="button"
              className="doctor-profile"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="profile-info">
                <div className="profile-name">{displayName}</div>
                <div className="profile-role">Dokter</div>
              </div>
              <div className="profile-avatar">{initials}</div>
            </button>

            {menuOpen && (
              <div className="profile-menu" role="menu">
                <button
                  type="button"
                  className="profile-menu-item profile-menu-logout"
                  role="menuitem"
                  onClick={handleLogoutToRme}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card">
          <h2>Ringkasan</h2>
          <p>Dashboard dokter (mode testing). Silakan pilih Poli di sidebar.</p>
        </div>

        <div className="doctor-side-column">
          <div className="doctor-card">
            <h3>Aktivitas Terakhir</h3>
            <p>- Tidak ada aktivitas nyata (mode demo)</p>
          </div>
        </div>
      </div>
    </DWLayout>
  )
}

export default DWDokterDashboard
