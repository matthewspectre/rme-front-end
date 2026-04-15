import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DoctorDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState({
    full_name: 'Dr. Andi Setiawan',
    role_name: 'Dokter',
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser((prev) => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      console.error('Gagal membaca user dari localStorage', e)
    }
  }, [])

  const today = 'Selasa, 15 April 2026'
  const appointments = [
    { time: '09:00', name: 'Budi Santoso', complaint: 'Nyeri Dada', status: 'Selesai' },
    { time: '09:30', name: 'Siti Aminah', complaint: 'Kontrol Diabetes', status: 'Selesai' },
    { time: '10:15', name: 'Andi Pratama', complaint: 'Batuk Pilek', status: 'Menunggu' },
    { time: '11:00', name: 'Dewi Lestari', complaint: 'Rujukan', status: 'Menunggu' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('user')
    setMenuOpen(false)
    navigate('/')
  }

  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="doctor-dashboard">
      <aside className="doctor-sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">RME</div>
          <div className="logo-text">
            <span className="logo-title">RME-LINK</span>
            <span className="logo-subtitle">Rekam Medis Elektronik</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className="sidebar-item active">
            <span className="sidebar-icon">🏠</span>
            <span>Dashboard Utama</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">👥</span>
            <span>Daftar Pasien</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">📅</span>
            <span>Jadwal Janji Temu</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">📄</span>
            <span>Rekam Medis</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">🧪</span>
            <span>Hasil Lab &amp; Pencitraan</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">💊</span>
            <span>Resep Obat</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">💬</span>
            <span>Pesan</span>
          </button>
          <button className="sidebar-item">
            <span className="sidebar-icon">📊</span>
            <span>Laporan</span>
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Selamat Datang Kembali, {user.full_name}!</h1>
            <p className="doctor-date">Ringkasan Janji Temu Hari Ini ({today})</p>
          </div>
          <div className="doctor-profile-wrapper">
            <button
              type="button"
              className="doctor-profile"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <div className="profile-info">
                <span className="profile-name">{user.full_name}</span>
                <span className="profile-role">{user.role_name || 'Dokter'}</span>
              </div>
              <div className="profile-avatar">{initials}</div>
            </button>
            {menuOpen && (
              <div className="profile-menu">
                <button type="button" className="profile-menu-item" disabled>
                  Profil
                </button>
                <button type="button" className="profile-menu-item" disabled>
                  Pesan
                </button>
                <button
                  type="button"
                  className="profile-menu-item profile-menu-logout"
                  onClick={handleLogout}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="doctor-grid">
          <section className="doctor-card doctor-appointments">
            <div className="card-header">
              <h2>Janji Temu Hari Ini</h2>
              <span className="card-caption">{today}</span>
            </div>
            <div className="appointments-table">
              <div className="appointments-header">
                <span>Waktu</span>
                <span>Nama Pasien</span>
                <span>Keluhan Utama</span>
                <span>Status</span>
              </div>
              {appointments.map((item) => (
                <div key={item.time} className="appointments-row">
                  <span>{item.time}</span>
                  <span>{item.name}</span>
                  <span>{item.complaint}</span>
                  <span>
                    <span
                      className={
                        item.status === 'Selesai'
                          ? 'status-pill status-done'
                          : 'status-pill status-pending'
                      }
                    >
                      {item.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="doctor-side-column">
            <div className="doctor-card doctor-patients">
              <h2>Pasien Terakhir Ditemui</h2>
              <div className="patient-list">
                <div className="patient-item">
                  <div className="patient-avatar">BS</div>
                  <div>
                    <div className="patient-name">Budi Santoso</div>
                    <div className="patient-meta">55th • Hipertensi &amp; Diabetes</div>
                  </div>
                </div>
                <div className="patient-item">
                  <div className="patient-avatar">SA</div>
                  <div>
                    <div className="patient-name">Siti Aminah</div>
                    <div className="patient-meta">55th • Hipertensi &amp; Lab</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="doctor-card doctor-alerts">
              <h2>Notifikasi Penting &amp; Alert</h2>
              <ul className="alert-list">
                <li className="alert-item alert-critical">
                  <span className="alert-icon">!</span>
                  <div>
                    <div className="alert-title">Hasil Lab: Budi Santoso</div>
                    <div className="alert-text">Segera tinjau hasil lab terbaru.</div>
                  </div>
                </li>
                <li className="alert-item alert-warning">
                  <span className="alert-icon">!</span>
                  <div>
                    <div className="alert-title">Pesan Mendesak dari Lab</div>
                    <div className="alert-text">Ada catatan penting terkait pasien baru.</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="doctor-card doctor-chart">
              <h2>Kunjungan Pasien (Bulan Ini)</h2>
              <div className="chart-placeholder">
                <div className="chart-line" />
                <span className="chart-caption">Grafik kunjungan pasien akan ditampilkan di sini.</span>
              </div>
            </div>
          </section>
        </section>

        <footer className="doctor-footer">
          © 2026 Sistem Rekam Medis Elektronik. Data pasien terlindungi dan
          terenkripsi.
        </footer>
      </main>
    </div>
  )
}

export default DoctorDashboard
