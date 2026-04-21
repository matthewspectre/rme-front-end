import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function PoliPenyakitDalam() {
  const navigate = useNavigate()
  const userRaw = localStorage.getItem('user')
  let user = { full_name: 'Dokter' }
  try { if (userRaw) user = { ...user, ...JSON.parse(userRaw) } } catch (e) {}

  const initials = (user.full_name || '')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0,2)
    .join('')
    .toUpperCase()

  const [antrian, setAntrian] = useState([])
  const [loadingAntrian, setLoadingAntrian] = useState(false)
  const [antrianError, setAntrianError] = useState('')
  useEffect(() => {
    const load = async () => {
      setLoadingAntrian(true)
      setAntrianError('')
      try {
        const stored = localStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : {}

        const maybeDokterId = parsed?.idDokter ?? parsed?.dokterId ?? parsed?.dokter_id ?? parsed?.id_dokter ?? null
        let dokterId = maybeDokterId
        if (!dokterId) {
          const userId = parsed?.id ?? parsed?.userId ?? parsed?.id_user ?? null
          if (userId) {
            try {
              const res = await fetch(`${API_BASE_URL}/dokter/`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
              if (res.ok) {
                const list = await res.json()
                const dokters = Array.isArray(list) ? list : []
                const myDokter = dokters.find(d => (d.id_user == userId) || (d.idUser == userId) || (d.user_id == userId))
                if (myDokter) dokterId = myDokter.id
              }
            } catch (e) {
              // ignore
            }
          }
        }
        if (!dokterId) dokterId = 2

        const q = `${API_BASE_URL}/antrian/?idDokter=${encodeURIComponent(dokterId)}`
        const r = await fetch(q, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        if (!r.ok) {
          const loc = r.headers && r.headers.get ? r.headers.get('location') : null
          const text = `HTTP ${r.status} ${r.statusText}` + (loc ? ` -> ${loc}` : '')
          setAntrian([])
          setAntrianError(text)
          return
        }
        const contentType = r.headers && r.headers.get ? (r.headers.get('content-type') || '') : ''
        if (!contentType.includes('application/json')) {
          const text = await r.text()
          const short = (text || '').slice(0, 400)
          setAntrian([])
          setAntrianError(`Unexpected response (not JSON): ${short}`)
          return
        }
        const data = await r.json()
        setAntrian(Array.isArray(data) ? data : [])
      } catch (e) {
        setAntrian([])
        setAntrianError(String(e.message || e))
      } finally {
        setLoadingAntrian(false)
      }
    }
    load()
  }, [])

  const [selectedTab, setSelectedTab] = useState('anamnesis')
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    const loadPatient = async () => {
      try {
        if (!antrian || antrian.length === 0) {
          setSelectedPatient(null)
          return
        }
        const first = antrian[0]
        const pid = first.idPasien ?? first.id_pasien ?? first.pasien_id ?? first.id
        if (!pid) {
          setSelectedPatient(null)
          return
        }
        let r = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        if (!r.ok && r.status === 404) {
          try {
            r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
          } catch (e) {
            setSelectedPatient(null)
            return
          }
        }
        if (!r.ok) { setSelectedPatient(null); return }
        const d = await r.json()
        const p = Array.isArray(d) ? d[0] : d
        setSelectedPatient(p || null)
      } catch (e) {
        setSelectedPatient(null)
      }
    }
    loadPatient()
  }, [antrian])

  const location = useLocation()
  useEffect(() => {
    const idFromNav = location?.state?.idPasien
    if (idFromNav && antrian && antrian.length > 0) {
      const found = antrian.find(a => String(a.idPasien ?? a.id_pasien ?? a.pasien_id ?? a.id) === String(idFromNav))
      if (found) handleSelectPatient(found)
      else handleSelectPatient({ idPasien: idFromNav })
    }
  }, [location, antrian])

  const handleSelectPatient = async (antrianItem) => {
    try {
      const pid = antrianItem.idPasien ?? antrianItem.id_pasien ?? antrianItem.pasien_id ?? antrianItem.id
      if (!pid) return
      let r = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
      if (!r.ok && r.status === 404) {
        try {
          r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        } catch (e) { setSelectedPatient(null); return }
      }
      if (!r.ok) { setSelectedPatient(null); return }
      const data = await r.json()
      const p = Array.isArray(data) ? data[0] : data
      setSelectedPatient(p || null)
    } catch (e) {
      setSelectedPatient(null)
    }
  }

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
            <span className="sidebar-icon">🫀</span>
            <span>Poli Penyakit Dalam</span>
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Selamat Datang di Poli Penyakit Dalam</h1>
            <p className="doctor-date">Halaman sementara — konten pemeriksaan akan dikembangkan</p>
          </div>
          <div className="doctor-profile-wrapper">
            <div className="doctor-profile">
              <div className="profile-info">
                <span className="profile-name">{user.full_name}</span>
                <span className="profile-role">{user.role_name || 'Dokter'}</span>
              </div>
              <div className="profile-avatar">{initials}</div>
            </div>
          </div>
        </header>

        {/* Antrian pasien (hanya namaPasien) */}
        <div style={{ padding: '12px 24px', background: '#f8fafc' }}>
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)', overflowX: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {antrian.length === 0 ? (
              <span style={{ color: '#64748b' }}>{loadingAntrian ? 'Memuat antrian...' : 'Tidak ada pasien dalam antrian.'}</span>
            ) : (
              antrian.map((it) => {
                const pid = it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id
                const isActive = selectedPatient && String(selectedPatient.id) === String(pid)
                return (
                  <button key={it.id} type="button" onClick={() => handleSelectPatient(it)} style={{ background: isActive ? '#dbeafe' : '#e6f6ff', color: '#0369a1', padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{it.namaPasien}</button>
                )
              })
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>{antrianError || ''}</div>
        </div>

        {/* Daftar Pemeriksaan: tabs sementara */}
        <div style={{ padding: '12px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setSelectedTab('anamnesis')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'anamnesis' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'anamnesis' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'anamnesis' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Anamnesis</button>
            <button type="button" onClick={() => setSelectedTab('vital')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'vital' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'vital' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'vital' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Pemeriksaan Vital</button>
          </div>
          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)' }}>
            {selectedTab === 'anamnesis' ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                  <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                    <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', alignItems: 'start', lineHeight: '1.25' }}>
                        <div style={{ opacity: 0.9 }}>Tgl Masuk</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tanggalMasuk || '-'}</div>
                        <div style={{ opacity: 0.9 }}>NIK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nik || '-'}</div>
                        <div style={{ opacity: 0.9 }}>JK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.jenisKelamin || selectedPatient?.jk || '-'}</div>
                        <div style={{ opacity: 0.9 }}>TTL</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tempatTanggalLahir || (selectedPatient?.tempatLahir || selectedPatient?.ttl || '-')}</div>
                        <div style={{ opacity: 0.9 }}>No. Telp</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Alamat</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.alamat || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Kategori</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.kategori || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Pekerjaan</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.pekerjaan || '-'}</div>
                      </div>
                    </div>

                    
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Anamnesis (sementara)</h3>
                  <p style={{ margin: 0, color: '#475569' }}>Form anamnesis akan ditampilkan di sini. Untuk sekarang hanya placeholder.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                  <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                    <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Tgl Masuk</div><div>{selectedPatient?.tanggalMasuk || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>NIK</div><div>{selectedPatient?.nik || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>JK</div><div>{selectedPatient?.jenisKelamin || selectedPatient?.jk || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>TTL</div><div>{selectedPatient?.tempatTanggalLahir || (selectedPatient?.tempatLahir || selectedPatient?.ttl || '-')}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>No. Telp</div><div>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Alamat</div><div>{selectedPatient?.alamat || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Kategori</div><div>{selectedPatient?.kategori || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Pekerjaan</div><div>{selectedPatient?.pekerjaan || '-'}</div></div>
                    </div>

                    
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Pemeriksaan Vital (sementara)</h3>
                  <p style={{ margin: 0, color: '#475569' }}>Form pemeriksaan vital (tekanan darah, nadi, temperatur, dsb.) akan ditampilkan di sini.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PoliPenyakitDalam
