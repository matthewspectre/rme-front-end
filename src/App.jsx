import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import DoctorDashboard from './doctor/DoctorDashboard'
import FrontOfficeDashboard from './frontoffice/FrontOfficeDashboard'

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
      const res = await fetch('http://localhost:8080/auth/login', {
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
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dokter" element={<DoctorDashboard />} />
      <Route path="/front-office" element={<FrontOfficeDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
