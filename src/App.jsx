import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import DoctorDashboard from './doctor/DoctorDashboard'
import PoliUmum from './doctor/PoliUmum'
import PoliPenyakitDalam from './doctor/PoliPenyakitDalam'
import PoliBedah from './doctor/PoliBedah'
import FrontOfficeDashboard from './frontoffice/FrontOfficeDashboard'
import DataWarehouseLogin from './DataWarehouseLogin'
import DWMenu from './DWMenu'
import DWAdminDashboard from './DWAdminDashboard'
import DWPoliUmum from './dw/DWPoliUmum'
import DWPoliPenyakitDalam from './dw/DWPoliPenyakitDalam'
import DWPoliBedah from './dw/DWPoliBedah'
import ErrorBoundary from './ErrorBoundary'
import { API_BASE_URL } from './api'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!res.ok) {
        setError('Username atau password salah')
        return
      }

      const data = await res.json()

      // simpan data user agar bisa dipakai di dashboard
      localStorage.setItem('user', JSON.stringify(data))

      // role: 2 -> dashboard dokter
      if (data.role === 2) {
        navigate('/dokter')
      } else if (data.role === 1) {
        navigate('/admin')
      } else if (data.role === 3) {
        navigate('/front-office')
      } else {
        setError('Role pengguna tidak dikenal')
      }
    } catch (err) {
      console.error(err)
      setError('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="login-page">
        <div className="login-hero">
          <div className="hero-overlay">
            <h1 className="hero-title">RME-LINK</h1>
            <p className="hero-subtitle">
              Kelola data pasien dengan aman, efisien, dan terintegrasi
            </p>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-icon">
              <span role="img" aria-label="rekam medis">
                🗂️
              </span>
            </div>
            <h2 className="login-title">Selamat Datang</h2>
            <p className="login-subtitle">
              Masuk ke akun Anda untuk melanjutkan
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">@</span>
                  <input
                    id="username"
                    type="text"
                    placeholder="nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Kata Sandi</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type="password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

              <div className="form-footer">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Ingat saya</span>
                </label>
                <button type="button" className="link-button">
                  Lupa kata sandi?
                </button>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <p className="register-text">
              Belum punya akun?{' '}
              <button type="button" className="link-button">
                Hubungi Administrator
              </button>
            </p>

            <div style={{ marginTop: 12 }}>
              <DWMenu />
            </div>

            <p className="login-footer">
              © 2026 Sistem Rekam Medis Elektronik. Data pasien terlindungi dan
              terenkripsi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const lastErrorRaw = typeof window !== 'undefined' ? window.localStorage.getItem('lastAppError') : null
  const lastError = lastErrorRaw ? JSON.parse(lastErrorRaw) : null
  // clear stored last error so it doesn't persist across reloads
  if (typeof window !== 'undefined' && lastErrorRaw) {
    try { window.localStorage.removeItem('lastAppError') } catch (e) {}
  }

  return (
    <ErrorBoundary>
      {lastError && (
        <div style={{ background: '#fff3f2', border: '1px solid #fecaca', padding: 10, color: '#9f1239', margin: 8, borderRadius: 6 }}>
          <strong>Terjadi error sebelumnya:</strong> {lastError.message}
          <button style={{ marginLeft: 12 }} onClick={() => { localStorage.removeItem('lastAppError'); window.location.reload() }}>Clear</button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dokter" element={<DoctorDashboard />} />
        <Route path="/pemeriksaan/poli-umum" element={<PoliUmum />} />
        <Route path="/pemeriksaan/poli-penyakit-dalam" element={<PoliPenyakitDalam />} />
        <Route path="/pemeriksaan/poli-bedah" element={<PoliBedah />} />
        <Route path="/dw-login" element={<DataWarehouseLogin />} />
        <Route path="/dw-dashboard" element={<DWAdminDashboard />} />
        <Route path="/dw/poli-umum" element={<DWPoliUmum />} />
        <Route path="/dw/poli-penyakit-dalam" element={<DWPoliPenyakitDalam />} />
        <Route path="/dw/poli-bedah" element={<DWPoliBedah />} />

        <Route path="/front-office" element={<FrontOfficeDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
