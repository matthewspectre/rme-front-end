import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DWLayout from './dw/DWLayout'

function DWAdminDashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('dw_user')
    if (!raw) {
      navigate('/dw-login')
      return
    }
    try {
      const u = JSON.parse(raw)
      if (u.username !== 'admin') {
        navigate('/dw-login')
      }
    } catch (e) {
      navigate('/dw-login')
    }
  }, [navigate])

  return (
    <DWLayout>
      <div className="doctor-header">
        <div>
          <h1 className="doctor-title">Data Warehouse RME-LINK - Dashboard Admin</h1>
          <p className="doctor-date">{new Date().toLocaleString()}</p>
        </div>

        <div className="doctor-profile-wrapper">
          <button className="doctor-profile" onClick={() => {}}>
            <div className="profile-info">
              <div className="profile-name">Admin DW</div>
              <div className="profile-role">Administrator</div>
            </div>
            <div className="profile-avatar">AD</div>
          </button>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card">
          <h2>Ringkasan</h2>
          <p>Konten ringkasan sementara untuk Data Warehouse.</p>
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

export default DWAdminDashboard
