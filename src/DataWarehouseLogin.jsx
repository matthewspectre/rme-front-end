import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function DataWarehouseLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Data Warehouse RME-LINK - Login'
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Manual login logic for now: admin/admin -> DW dashboard
    if (username === 'admin' && password === 'admin') {
      try { localStorage.setItem('dw_user', JSON.stringify({ username: 'admin', role: 'dw_admin' })) } catch (e) {}
      setLoading(false)
      navigate('/dw-dashboard')
      return
    }

    setError('Username atau password salah')
    setLoading(false)
  }

  return (
    <div className="app">
      <div className="login-page">
        <div className="login-hero">
          <div className="hero-overlay">
            <h1 className="hero-title">Data Warehouse RME-LINK</h1>
            <p className="hero-subtitle">Kelola data pasien dengan aman, efisien, dan terintegrasi</p>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-icon">
              <span role="img" aria-label="rekam medis">🗂️</span>
            </div>
            <h2 className="login-title">Selamat Datang</h2>
            <p className="login-subtitle">Masuk ke akun Anda untuk melanjutkan</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="dw-username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">@</span>
                  <input
                    id="dw-username"
                    type="text"
                    placeholder="nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dw-password">Kata Sandi</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="dw-password"
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
                <button type="button" className="link-button">Lupa kata sandi?</button>
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <p className="register-text">
              Belum punya akun?{' '}
              <button type="button" className="link-button">Hubungi Administrator</button>
            </p>

            <p className="login-footer">© 2026 Data Warehouse. Akses dan data terlindungi.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataWarehouseLogin
