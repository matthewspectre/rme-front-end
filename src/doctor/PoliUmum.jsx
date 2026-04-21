import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function PoliUmum() {
  const navigate = useNavigate()
  const userRaw = localStorage.getItem('user')
  let user = { full_name: 'Dokter' }
  try { if (userRaw) user = { ...user, ...JSON.parse(userRaw) } } catch (e) {}
  // state & refs (declare before any functions/effects that use them)
  const [antrian, setAntrian] = useState([])
  const [loadingAntrian, setLoadingAntrian] = useState(false)
  const [antrianError, setAntrianError] = useState('')

  const [selectedTab, setSelectedTab] = useState('anamnesis')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [dokterId, setDokterId] = useState(null)

  const [anamnesisText, setAnamnesisText] = useState('')
  const [riwayatPengobatan, setRiwayatPengobatan] = useState('')
  const [riwayatKeluarga, setRiwayatKeluarga] = useState('')
  const [riwayatPenyakitDahulu, setRiwayatPenyakitDahulu] = useState('')
  const [riwayatPenyakitLain, setRiwayatPenyakitLain] = useState('')
  const [statusKehamilan, setStatusKehamilan] = useState('')
  const [keluhanTambahan, setKeluhanTambahan] = useState('')
  const [anamnesisMessage, setAnamnesisMessage] = useState('')
  const [isSubmittingAnamnesis, setIsSubmittingAnamnesis] = useState(false)

  const [anamnesisHistory, setAnamnesisHistory] = useState([])
  const [loadingAnamnesisHistory, setLoadingAnamnesisHistory] = useState(false)
  const [anamnesisHistoryError, setAnamnesisHistoryError] = useState('')

  const [hoveredPatientId, setHoveredPatientId] = useState(null)
  const lastFetchedPatientId = useRef(null)
  const historyFetchController = useRef(null)
  const hoverTimer = useRef(null)
  // load antrian list when dokterId is available (filter by idDokter)
  useEffect(() => {
    let cancelled = false
    if (!dokterId) return
    const load = async () => {
      try {
        setLoadingAntrian(true)
        setAntrianError('')
        const q = `${API_BASE_URL}/antrian/?idDokter=${encodeURIComponent(dokterId)}`
        const q2 = `${API_BASE_URL}/antrian?idDokter=${encodeURIComponent(dokterId)}`
        const urls = [q, q2, `http://localhost:8080/antrian/?idDokter=${encodeURIComponent(dokterId)}`, `http://localhost:8080/antrian?idDokter=${encodeURIComponent(dokterId)}`]
        let lastErr = null
        let res = null
        for (const u of urls) {
          try {
            res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
            if (res && res.ok) break
            lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
          } catch (e) {
            lastErr = e
          }
        }
        if (cancelled) return
        if (!res || !res.ok) {
          setAntrian([])
          setAntrianError('Tidak ada pasien dalam antrian.')
          return
        }
        const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
        if (!contentType.includes('application/json')) {
          setAntrian([])
          setAntrianError('Unexpected response when loading antrian')
          return
        }
        const data = await res.json()
        setAntrian(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed loading antrian', e)
        if (!cancelled) {
          setAntrian([])
          setAntrianError('Gagal memuat antrian')
        }
      } finally {
        if (!cancelled) setLoadingAntrian(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [dokterId])
  // fetch anamnesis history for a given patient id
  const fetchAnamnesisHistory = async (id) => {
    try {
      if (!id) {
        setAnamnesisHistory([])
        setAnamnesisHistoryError('')
        lastFetchedPatientId.current = null
        return
      }

      const pidStr = String(id)
      if (lastFetchedPatientId.current === pidStr) return
      lastFetchedPatientId.current = pidStr

      if (historyFetchController.current) {
        try { historyFetchController.current.abort() } catch (e) {}
      }
      historyFetchController.current = new AbortController()
      const signal = historyFetchController.current.signal

      setLoadingAnamnesisHistory(true)
      setAnamnesisHistoryError('')

      const urlsToTry = [
        `${API_BASE_URL}/anamnesis?idPasien=${encodeURIComponent(id)}`,
        `${API_BASE_URL}/anamnesis/?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/anamnesis?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/anamnesis/?idPasien=${encodeURIComponent(id)}`
      ]

      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', signal })
          if (res && res.ok) break
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          if (e.name === 'AbortError') return
          lastErr = e
        }
      }

      if (!res || !res.ok) {
        setAnamnesisHistory([])
        setAnamnesisHistoryError(`Gagal memuat riwayat anamnesis: ${String(lastErr)}`)
        return
      }

      const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '')
        setAnamnesisHistory([])
        setAnamnesisHistoryError(`Unexpected response (not JSON): ${String(text).slice(0,200)}`)
        return
      }

      const data = await res.json()
      setAnamnesisHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed loading anamnesis history', e)
      setAnamnesisHistory([])
      setAnamnesisHistoryError(String(e.message || e))
    } finally {
      setLoadingAnamnesisHistory(false)
    }
  }

  // load anamnesis history when selected patient or hovered patient changes
  useEffect(() => {
    const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
    fetchAnamnesisHistory(pid)

    return () => {
      if (historyFetchController.current) {
        try { historyFetchController.current.abort() } catch (e) {}
        historyFetchController.current = null
      }
    }
  }, [hoveredPatientId, selectedPatient, antrian])
 

  useEffect(() => {
    // when antrian changes, fetch patient details for the first entry (if any)
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
        // try via API_BASE_URL (proxy); if 404, fallback to backend host directly
        let r = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (!r.ok && r.status === 404) {
          try {
            r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          } catch (e) {
            console.error('Fallback fetch failed', e)
            setSelectedPatient(null)
            return
          }
        }
        if (!r.ok) {
          setSelectedPatient(null)
          return
        }
        const d = await r.json()
        const p = Array.isArray(d) ? d[0] : d
        setSelectedPatient(p || null)
      } catch (e) {
        console.error('Failed to load patient details', e)
        setSelectedPatient(null)
      }
    }

    loadPatient()
  }, [antrian])

  // determine dokter id once on mount (try localStorage first, then /dokter/)
  useEffect(() => {
    const determine = async () => {
      try {
        const stored = localStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : {}
        const maybe = parsed?.idDokter ?? parsed?.dokterId ?? parsed?.dokter_id ?? parsed?.id_dokter ?? null
        if (maybe) {
          setDokterId(maybe)
          return
        }
        const userId = parsed?.id ?? parsed?.userId ?? parsed?.id_user ?? null
        if (!userId) return
        try {
          const res = await fetch(`${API_BASE_URL}/dokter/`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (!res.ok) return
          const list = await res.json()
          const dokters = Array.isArray(list) ? list : []
          const myDokter = dokters.find(d => (d.id_user == userId) || (d.idUser == userId) || (d.user_id == userId))
          if (myDokter) setDokterId(myDokter.id)
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    }
    determine()
  }, [])

  const location = useLocation()

  useEffect(() => {
    // if navigated here with state.idPasien, select that patient after antrian loads
    const idFromNav = location?.state?.idPasien
    if (idFromNav && antrian && antrian.length > 0) {
      const found = antrian.find(a => String(a.idPasien ?? a.id_pasien ?? a.pasien_id ?? a.id) === String(idFromNav))
      if (found) {
        handleSelectPatient(found)
      } else {
        handleSelectPatient({ idPasien: idFromNav })
      }
      // also mark as hovered so anamnesis/history shows immediately
      try { setHoveredPatientId(idFromNav) } catch (e) { /* ignore */ }
    }
  }, [location, antrian])


  const patientCard = (
    <div style={{ width: 360, display: 'flex' }}>
      <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '-') : (antrian[0]?.namaPasien || ' - ')}</div>
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

        <div style={{ marginTop: 14, borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Tekanan Darah : -</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Nadi : -</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>RR : -</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Saturasi Oksigen : -</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Temperatur : -</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Berat Badan : -</div>
        </div>
      </div>
    </div>
  )

  const handleSelectPatient = async (antrianItem) => {
    try {
      const pid = antrianItem.idPasien ?? antrianItem.id_pasien ?? antrianItem.pasien_id ?? antrianItem.id
      if (!pid) return
      // fetch patient by idPasien
      // try via API proxy first (use trailing slash), fallback to backend if 404
      let r = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
      if (!r.ok && r.status === 404) {
        try {
          r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        } catch (e) {
          console.error('Fallback fetch failed', e)
          setSelectedPatient(null)
          return
        }
      }
      if (!r.ok) {
        console.error('Failed fetch patient', r.status, r.statusText)
        setSelectedPatient(null)
        return
      }
      const data = await r.json()
      const p = Array.isArray(data) ? data[0] : data
      setSelectedPatient(p || null)
    } catch (e) {
      console.error('Error loading patient', e)
      setSelectedPatient(null)
    }
  }

  const initials = (user.full_name || '')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0,2)
    .join('')
    .toUpperCase()

  

  // (removed calcAge; umur tidak ditampilkan)

  return (
    <div className="doctor-dashboard">
      <aside className="doctor-sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">RME</div>
          <div className="logo-text">
            <span className="logo-title">RME-LINK</span>
            <span className="logo-subtitle">Rekam Medis Elektronik</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>
            {loadingAntrian ? 'Memuat antrian...' : (antrianError || '')}
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className="sidebar-item" onClick={() => navigate('/dokter')}>
            <span className="sidebar-icon">🏠</span>
            <span>Dashboard Utama</span>
          </button>
          <button className="sidebar-item active">
            <span className="sidebar-icon">🩺</span>
            <span>Poli Umum</span>
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Selamat Datang di Poli Umum</h1>
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
              <span style={{ color: '#64748b' }}>Tidak ada pasien dalam antrian.</span>
            ) : (
              antrian.map((it) => {
                const pid = it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id
                const isActive = selectedPatient && (String(selectedPatient.id) === String(pid))
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleSelectPatient(it)}
                    onMouseEnter={() => {
                      // debounce hover to avoid rapid enter/leave triggers
                      if (hoverTimer.current) clearTimeout(hoverTimer.current)
                      hoverTimer.current = setTimeout(() => { setHoveredPatientId(pid) }, 250)
                    }}
                    onMouseLeave={() => {
                      if (hoverTimer.current) {
                        clearTimeout(hoverTimer.current)
                        hoverTimer.current = null
                      }
                      setHoveredPatientId(null)
                    }}
                    style={{
                      background: isActive ? '#dbeafe' : '#e6f6ff',
                      color: '#0369a1',
                      padding: '8px 14px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {it.namaPasien}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Daftar Pemeriksaan: tabs sementara */}
        <div style={{ padding: '12px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setSelectedTab('anamnesis')}
              style={{
                padding: '8px 14px', borderRadius: 999, border: selectedTab === 'anamnesis' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'anamnesis' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'anamnesis' ? '#0b57d0' : '#374151', cursor: 'pointer'
              }}
            >
              Anamnesis
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('vital')}
              style={{
                padding: '8px 14px', borderRadius: 999, border: selectedTab === 'vital' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'vital' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'vital' ? '#0b57d0' : '#374151', cursor: 'pointer'
              }}
            >
              Pemeriksaan Vital
            </button>
          </div>

          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)' }}>
            {selectedTab === 'anamnesis' ? (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                  {patientCard}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>Anamnesis</h3>
                    <div style={{ color: '#475569' }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Ringkasan Anamnesis</label>
                      <textarea value={anamnesisText} onChange={(e) => setAnamnesisText(e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Pengobatan</label>
                        <input value={riwayatPengobatan} onChange={(e) => setRiwayatPengobatan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Keluarga</label>
                        <input value={riwayatKeluarga} onChange={(e) => setRiwayatKeluarga(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Penyakit Dahulu</label>
                        <input value={riwayatPenyakitDahulu} onChange={(e) => setRiwayatPenyakitDahulu(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Penyakit Lain</label>
                        <input value={riwayatPenyakitLain} onChange={(e) => setRiwayatPenyakitLain(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Status Kehamilan</label>
                        <select value={statusKehamilan} onChange={(e) => setStatusKehamilan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', background: '#fff' }}>
                          <option value="">Pilih status kehamilan</option>
                          <option value="tidak hamil">tidak hamil</option>
                          <option value="hamil">hamil</option>
                          <option value="tidak diketahui">tidak diketahui</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Keluhan Tambahan</label>
                        <input value={keluhanTambahan} onChange={(e) => setKeluhanTambahan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          // submit anamnesis
                          setAnamnesisMessage('')
                          setIsSubmittingAnamnesis(true)
                          try {
                            const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id)
                            if (!pid) throw new Error('Tidak ada idPasien terpilih')
                            const payload = {
                              idPasien: Number(pid),
                              idDokter: dokterId ? Number(dokterId) : undefined,
                              text: anamnesisText,
                              idDataKlinik: 1,
                              riwayatPengobatan,
                              riwayatKeluarga,
                              riwayatPenyakitDahulu,
                              riwayatPenyakitLain,
                              statusKehamilan,
                              keluhanTambahan
                            }
                            // if idDokter unknown, remove key so backend can decide
                            if (!payload.idDokter) delete payload.idDokter

                            // try proxy endpoint with trailing slash first to avoid backend 301 redirects
                            let res = await fetch(`${API_BASE_URL}/anamnesis/`, {
                              method: 'POST',
                              credentials: 'include',
                              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                              redirect: 'follow'
                            })
                            if (!res.ok && res.status === 404) {
                              // try backend directly with trailing slash
                              try {
                                res = await fetch(`http://localhost:8080/anamnesis/`, {
                                  method: 'POST',
                                  credentials: 'include',
                                  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                                  body: JSON.stringify(payload),
                                  redirect: 'follow'
                                })
                              } catch (e) {
                                throw e
                              }
                            }
                            if (!res.ok) {
                              const text = await res.text().catch(() => '')
                              throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`)
                            }
                            setAnamnesisMessage('Anamnesis tersimpan.')
                            // refresh history for this patient so new entry appears immediately
                            try {
                              await fetchAnamnesisHistory(pid)
                            } catch (e) {
                              console.error('Failed refreshing anamnesis after save', e)
                            }
                          } catch (e) {
                            console.error('Failed to submit anamnesis', e)
                            setAnamnesisMessage('Gagal menyimpan anamnesis: ' + (e.message || e))
                          } finally {
                            setIsSubmittingAnamnesis(false)
                          }
                        }}
                        disabled={isSubmittingAnamnesis}
                        style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                      >
                        {isSubmittingAnamnesis ? 'Menyimpan...' : 'Simpan Anamnesis'}
                      </button>
                      <div style={{ marginTop: 8, color: anamnesisMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{anamnesisMessage}</div>
                    </div>

                    </div>
                  </div>
                </div>

                {/* Riwayat Anamnesis - full width under form */}
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ margin: '6px 0 12px 0' }}>Riwayat Anamnesis</h4>
                  {loadingAnamnesisHistory ? (
                    <div style={{ color: '#64748b' }}>Memuat riwayat anamnesis...</div>
                  ) : anamnesisHistoryError ? (
                    <div style={{ color: '#b91c1c' }}>{anamnesisHistoryError}</div>
                  ) : (!anamnesisHistory || anamnesisHistory.length === 0) ? (
                    <div style={{ color: '#64748b' }}>Belum ada riwayat anamnesis.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '12px 8px', width: 110 }}>Aksi</th>
                            <th style={{ padding: '12px 8px' }}>Tanggal</th>
                            <th style={{ padding: '12px 8px' }}>Keluhan Utama</th>
                            <th style={{ padding: '12px 8px' }}>Keterangan Keluhan Utama</th>
                            <th style={{ padding: '12px 8px' }}>Keluhan Tambahan</th>
                            <th style={{ padding: '12px 8px' }}>Status Kehamilan</th>
                            <th style={{ padding: '12px 8px' }}>Riwayat Pengobatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anamnesisHistory.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                  <button type="button" onClick={() => console.log('ubah', row)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                  <button type="button" onClick={() => console.log('hapus', row)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>HAPUS</button>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{row.date_make ?? row.dateMake ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.text ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.keterangan_keluhan_utama ?? row.keteranganKeluhanUtama ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.keluhan_tambahan ?? row.keluhanTambahan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.status_kehamilan ?? row.statusKehamilan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.riwayat_pengobatan ?? row.riwayatPengobatan ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {patientCard}
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Pemeriksaan Vital (sementara)</h3>
                  <p style={{ margin: 0, color: '#475569' }}>Form pemeriksaan vital (tekanan darah, nadi, temperatur, dsb.) akan ditampilkan di sini.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <section style={{padding:24}}>
          <div style={{color:'#374151'}}>Ini adalah tampilan awal untuk <strong>Poli Umum</strong>. Sidebar dan header sudah tersedia.</div>
        </section>
      </main>
    </div>
  )
}

export default PoliUmum
