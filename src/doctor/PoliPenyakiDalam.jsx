import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function PoliPenyakiDalam() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(null)
  const [message, setMessage] = useState('')
  const [patients, setPatients] = useState([])
  const [user, setUser] = useState({ full_name: 'Dokter' })
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const today = now.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : null
        if (parsed) setUser((prev) => ({ ...prev, ...parsed }))
        const userId = parsed?.id ?? parsed?.userId ?? parsed?.id_user

        const dokterRes = await fetch(`${API_BASE_URL}/dokter/`)
        if (!dokterRes.ok) throw new Error('Gagal mengambil daftar dokter')
        const dokterData = await dokterRes.json()
        const dokters = Array.isArray(dokterData) ? dokterData : []

        const myDokter = dokters.find((d) => (d.id_user == userId) || (d.idUser == userId) || (d.user_id == userId))

        if (!myDokter) {
          setAllowed(false)
          setMessage('Akses ditolak: akun ini bukan dokter terdaftar')
          return
        }

        const poliVal = myDokter.poli ?? myDokter.idPoli ?? myDokter.poli_id ?? myDokter.id_poli ?? null
        if (Number(poliVal) !== 2) {
          setAllowed(false)
          setMessage('Akses ditolak: hanya dokter Poli Penyakit Dalam yang dapat membuka halaman ini')
          return
        }

        setAllowed(true)

        const antrianRes = await fetch(`${API_BASE_URL}/antrian/`)
        if (!antrianRes.ok) {
          setPatients([])
          return
        }
        const antrianData = await antrianRes.json()
        const list = (Array.isArray(antrianData) ? antrianData : []).filter(it => (
          (it.idPoli != null && Number(it.idPoli) === 2) ||
          (it.id_poli != null && Number(it.id_poli) === 2) ||
          (it.poli != null && Number(it.poli) === 2) ||
          (it.poli_id != null && Number(it.poli_id) === 2)
        ))

        setPatients(list)
      } catch (e) {
        console.error(e)
        setAllowed(false)
        setMessage('Terjadi kesalahan saat memeriksa akses')
      }
    }

    init()
  }, [navigate])

  if (allowed === null) return <div>Memeriksa hak akses...</div>

  if (!allowed) return (
    <div style={{ padding: 20 }}>
      <h2>Poli Penyakit Dalam</h2>
      <p style={{ color: '#b91c1c' }}>{message}</p>
      <button type="button" onClick={() => navigate('/dokter')}>Kembali</button>
    </div>
  )

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
          <button className="sidebar-item" onClick={() => navigate('/dokter')}>
            <span className="sidebar-icon">🏠</span>
            <span>Dashboard Utama</span>
          </button>
          <button className="sidebar-item active">
            <span className="sidebar-icon">🩺</span>
            <span>Pemeriksaan</span>
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Poli Penyakit Dalam — {user.full_name}</h1>
            <p className="doctor-date">{today}</p>
          </div>
        </header>

        <section className="doctor-grid">
          <section className="doctor-card" style={{ width: '100%' }}>
            <div className="card-header">
              <h2>Daftar Antrian Poli Penyakit Dalam</h2>
            </div>
            <div style={{ marginTop: 8 }}>
              {patients.length === 0 && <div>Tidak ada antrian saat ini.</div>}
              {patients.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Nama Pasien</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{p.id}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{p.namaPasien || p.nama || '-'}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{p.keluhan || p.catatan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>

        <footer className="doctor-footer">
          © 2026 Sistem Rekam Medis Elektronik.
        </footer>
      </main>
    </div>
  )
}

export default PoliPenyakiDalam
