import React, { useEffect, useState } from 'react'
import DWLayout from './DWLayout'
import { API_BASE_URL } from '../api'

export default function DWPoliBedah() {
  const [selectedTab, setSelectedTab] = useState('lokalis')

  const [etlLokalisLoading, setEtlLokalisLoading] = useState(false)
  const [etlLokalisError, setEtlLokalisError] = useState('')
  const [etlLokalisResult, setEtlLokalisResult] = useState(null)
  const [lokalisRefreshKey, setLokalisRefreshKey] = useState(0)

  const [etlFungsiLoading, setEtlFungsiLoading] = useState(false)
  const [etlFungsiError, setEtlFungsiError] = useState('')
  const [etlFungsiResult, setEtlFungsiResult] = useState(null)
  const [fungsiRefreshKey, setFungsiRefreshKey] = useState(0)

  const [etlPenunjangLoading, setEtlPenunjangLoading] = useState(false)
  const [etlPenunjangError, setEtlPenunjangError] = useState('')
  const [etlPenunjangResult, setEtlPenunjangResult] = useState(null)
  const [penunjangRefreshKey, setPenunjangRefreshKey] = useState(0)

  let isDwAdmin = false
  try {
    const raw = localStorage.getItem('dw_user')
    const u = raw ? JSON.parse(raw) : null
    isDwAdmin = (u?.role === 'dw_admin') || (u?.username === 'admin')
  } catch (e) {
    isDwAdmin = false
  }

  const [patients, setPatients] = useState([])
  const [patientQuery, setPatientQuery] = useState('')
  const [patientNik, setPatientNik] = useState('')

  const [loadingLokalis, setLoadingLokalis] = useState(false)
  const [lokalisError, setLokalisError] = useState('')
  const [lokalis, setLokalis] = useState([])

  const [loadingFungsi, setLoadingFungsi] = useState(false)
  const [fungsiError, setFungsiError] = useState('')
  const [fungsi, setFungsi] = useState([])

  const [loadingPenunjang, setLoadingPenunjang] = useState(false)
  const [penunjangError, setPenunjangError] = useState('')
  const [penunjang, setPenunjang] = useState([])

  useEffect(() => {
    let mounted = true
    const loadPatients = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients`, { cache: 'no-store' })
        if (!mounted) return
        if (!res.ok) {
          setPatients([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setPatients(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        setPatients([])
      }
    }
    loadPatients()
    return () => { mounted = false }
  }, [])

  const formatDateJakarta = (value) => {
    if (!value) return '-'
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return String(value)
      const dtf = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
      const parts = dtf.formatToParts(d)
      const map = {}
      for (const p of parts) map[p.type] = p.value
      return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}:${map.second}`
    } catch (e) {
      return String(value)
    }
  }

  useEffect(() => {
    let mounted = true

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/lokalis_bedah/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/lokalis_bedah/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingLokalis(true)
      setLokalisError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setLokalisError(`HTTP ${res.status} ${res.statusText}`)
          setLokalis([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setLokalis(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setLokalisError(e instanceof Error ? e.message : String(e))
        setLokalis([])
      } finally {
        if (mounted) setLoadingLokalis(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [patientNik, lokalisRefreshKey])

  const runEtlLokalis = async () => {
    if (!isDwAdmin) return
    setEtlLokalisLoading(true)
    setEtlLokalisError('')
    setEtlLokalisResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/lokalis_bedah/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlLokalisResult(js)
      setLokalisRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlLokalisError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlLokalisLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'fungsi') return () => { mounted = false }

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/pemeriksaan_fungsi_organ/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/pemeriksaan_fungsi_organ/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingFungsi(true)
      setFungsiError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setFungsiError(`HTTP ${res.status} ${res.statusText}`)
          setFungsi([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setFungsi(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setFungsiError(e instanceof Error ? e.message : String(e))
        setFungsi([])
      } finally {
        if (mounted) setLoadingFungsi(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [selectedTab, patientNik, fungsiRefreshKey])

  const runEtlFungsi = async () => {
    if (!isDwAdmin) return
    setEtlFungsiLoading(true)
    setEtlFungsiError('')
    setEtlFungsiResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_fungsi_organ/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlFungsiResult(js)
      setFungsiRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlFungsiError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlFungsiLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'penunjang') return () => { mounted = false }

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/pemeriksaan_penunjang_bedah/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/pemeriksaan_penunjang_bedah/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingPenunjang(true)
      setPenunjangError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setPenunjangError(`HTTP ${res.status} ${res.statusText}`)
          setPenunjang([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setPenunjang(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setPenunjangError(e instanceof Error ? e.message : String(e))
        setPenunjang([])
      } finally {
        if (mounted) setLoadingPenunjang(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [selectedTab, patientNik, penunjangRefreshKey])

  const runEtlPenunjang = async () => {
    if (!isDwAdmin) return
    setEtlPenunjangLoading(true)
    setEtlPenunjangError('')
    setEtlPenunjangResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_penunjang_bedah/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlPenunjangResult(js)
      setPenunjangRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlPenunjangError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlPenunjangLoading(false)
    }
  }

  const normalizedNik = String(patientNik || '').trim()
  const matchedPatientByNik = normalizedNik
    ? (Array.isArray(patients) ? patients : []).find((p) => String(p?.nik ?? '').trim() === normalizedNik)
    : null

  const effectiveQuery = matchedPatientByNik?.namaPasien ? String(matchedPatientByNik.namaPasien) : String(patientQuery || '')
  const normalizedQuery = String(effectiveQuery || '').trim().toLowerCase()

  const getRowPatientName = (row) => String(row?.nama_pasien ?? row?.namaPasien ?? row?.nama ?? '').trim()
  const filterByPatientName = (rows) => {
    if (!normalizedQuery) return rows
    const list = (Array.isArray(rows) ? rows : [])
    if (normalizedNik) {
      if (!matchedPatientByNik?.namaPasien) return []
      const target = String(matchedPatientByNik.namaPasien).trim().toLowerCase()
      return list.filter((row) => getRowPatientName(row).toLowerCase() === target)
    }
    return list.filter((row) => getRowPatientName(row).toLowerCase().includes(normalizedQuery))
  }

  const visibleLokalis = filterByPatientName(lokalis)
  const visibleFungsi = filterByPatientName(fungsi)
  const visiblePenunjang = filterByPatientName(penunjang)

  const patientNameOptions = Array.from(
    new Set(
      (Array.isArray(patients) ? patients : [])
        .map((p) => String(p?.namaPasien ?? '').trim())
        .filter(Boolean)
        .filter((name) => (normalizedQuery ? name.toLowerCase().includes(normalizedQuery) : true))
    )
  ).slice(0, 30)

  const fmtBool = (v) => (v === null || typeof v === 'undefined') ? '-' : (v ? 'Ya' : 'Tidak')

  return (
    <DWLayout>
      <div className="doctor-header">
        <div>
          <h1 className="doctor-title">Data Warehouse RME-LINK - Poli Bedah</h1>
          <p className="doctor-date">{formatDateJakarta(new Date())}</p>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setSelectedTab('lokalis')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'lokalis' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'lokalis' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'lokalis' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Lokalis Bedah
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('fungsi')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'fungsi' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'fungsi' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'fungsi' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Fungsi Organ
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('penunjang')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'penunjang' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'penunjang' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'penunjang' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Penunjang Bedah
            </button>
          </div>

          {selectedTab === 'lokalis' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Lokalis Bedah</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlLokalis}
                      disabled={etlLokalisLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlLokalisLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlLokalisLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlLokalisLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlLokalisError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlLokalisError}</div>}
                  {etlLokalisResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlLokalisResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlLokalisResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlLokalisResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Lokalis Bedah (Warehouse)</h2>
                <div style={{ minWidth: 320, maxWidth: 520, flex: '1 1 320px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    value={patientNik}
                    onChange={(e) => setPatientNik(e.target.value)}
                    placeholder="Cari berdasarkan NIK..."
                    style={{
                      width: 220,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Cari berdasarkan pasien..."
                    list="dw-patient-options"
                    style={{
                      width: 260,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                </div>
              </div>
              {loadingLokalis && <div>Memuat riwayat...</div>}
              {lokalisError && <div style={{ color: 'var(--error)' }}>{lokalisError}</div>}

              {!loadingLokalis && !lokalisError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1600 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Lokasi Kelainan</th>
                        <th>Jenis Kelainan</th>
                        <th>Ukuran</th>
                        <th>Warna</th>
                        <th>Nyeri Tekan</th>
                        <th>Konsistensi</th>
                        <th>Mobilitas</th>
                        <th>Tanda Radang</th>
                        <th>Fluktuasi</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLokalis.map((row, idx) => (
                        <tr key={(row.id_lokalis_bedah ?? row.id) ? `${row.source ?? ''}-${row.id_lokalis_bedah ?? row.id}-${row.tanggal ?? row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.tanggal ?? row.date_make ?? row.waktu ?? row.createdAt)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{row.lokasiKelainan ?? row.lokasi_kelainan ?? row.lokasi ?? '-'}</td>
                          <td>{row.jenisKelainan ?? row.jenis_kelainan ?? row.jenis ?? '-'}</td>
                          <td>{row.ukuran ?? '-'}</td>
                          <td>{row.warna ?? '-'}</td>
                          <td>{fmtBool(row.nyeriTekan ?? row.nyeri_tekan)}</td>
                          <td>{row.konsistensi ?? '-'}</td>
                          <td>{row.mobilitas ?? '-'}</td>
                          <td>{fmtBool(row.tandaRadang ?? row.tanda_radang)}</td>
                          <td>{fmtBool(row.fluktuasi)}</td>
                          <td style={{ whiteSpace: 'pre-wrap' }}>{row.catatan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTab === 'fungsi' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Fungsi Organ</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlFungsi}
                      disabled={etlFungsiLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlFungsiLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlFungsiLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlFungsiLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlFungsiError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlFungsiError}</div>}
                  {etlFungsiResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlFungsiResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlFungsiResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlFungsiResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Fungsi Organ (Warehouse)</h2>
                <div style={{ minWidth: 320, maxWidth: 520, flex: '1 1 320px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    value={patientNik}
                    onChange={(e) => setPatientNik(e.target.value)}
                    placeholder="Cari berdasarkan NIK..."
                    style={{
                      width: 220,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Cari berdasarkan pasien..."
                    list="dw-patient-options"
                    style={{
                      width: 260,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                </div>
              </div>
              {loadingFungsi && <div>Memuat riwayat...</div>}
              {fungsiError && <div style={{ color: 'var(--error)' }}>{fungsiError}</div>}

              {!loadingFungsi && !fungsiError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1400 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Gangguan BAB</th>
                        <th>Gangguan BAK</th>
                        <th>Mual/Muntah</th>
                        <th>Demam</th>
                        <th>Perdarahan</th>
                        <th>Penurunan BB</th>
                        <th>Gangguan Gerak</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFungsi.map((row, idx) => (
                        <tr key={(row.id_pemeriksaan_fungsi_organ ?? row.id) ? `${row.source ?? ''}-${row.id_pemeriksaan_fungsi_organ ?? row.id}-${row.tanggal ?? row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.tanggal ?? row.date_make ?? row.waktu ?? row.createdAt)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{fmtBool(row.gangguanBAB ?? row.gangguan_bab)}</td>
                          <td>{fmtBool(row.gangguanBAK ?? row.gangguan_bak)}</td>
                          <td>{fmtBool(row.mualMuntah ?? row.mual_muntah)}</td>
                          <td>{fmtBool(row.demam)}</td>
                          <td>{fmtBool(row.perdarahan)}</td>
                          <td>{fmtBool(row.penurunanBB ?? row.penurunan_bb)}</td>
                          <td>{fmtBool(row.gangguanGerak ?? row.gangguan_gerak)}</td>
                          <td style={{ whiteSpace: 'pre-wrap' }}>{row.catatan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTab === 'penunjang' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Penunjang Bedah</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlPenunjang}
                      disabled={etlPenunjangLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlPenunjangLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlPenunjangLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlPenunjangLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlPenunjangError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlPenunjangError}</div>}
                  {etlPenunjangResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlPenunjangResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlPenunjangResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlPenunjangResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Penunjang Bedah (Warehouse)</h2>
                <div style={{ minWidth: 320, maxWidth: 520, flex: '1 1 320px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    value={patientNik}
                    onChange={(e) => setPatientNik(e.target.value)}
                    placeholder="Cari berdasarkan NIK..."
                    style={{
                      width: 220,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Cari berdasarkan pasien..."
                    list="dw-patient-options"
                    style={{
                      width: 260,
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #111827',
                      outline: 'none',
                      fontSize: 13,
                      background: '#ffffff'
                    }}
                  />
                </div>
              </div>
              {loadingPenunjang && <div>Memuat riwayat...</div>}
              {penunjangError && <div style={{ color: 'var(--error)' }}>{penunjangError}</div>}

              {!loadingPenunjang && !penunjangError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1700 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Butuh USG</th>
                        <th>Butuh Rontgen</th>
                        <th>Butuh CT Scan</th>
                        <th>Butuh Biopsi</th>
                        <th>Status Operasi</th>
                        <th>Jenis Tindakan</th>
                        <th>Prioritas</th>
                        <th>Jadwal Bedah</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePenunjang.map((row, idx) => (
                        <tr key={(row.id_pemeriksaan_penunjang_bedah ?? row.id) ? `${row.source ?? ''}-${row.id_pemeriksaan_penunjang_bedah ?? row.id}-${row.tanggal ?? row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.tanggal ?? row.date_make ?? row.waktu ?? row.createdAt)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{fmtBool(row.butuhUSG ?? row.butuh_usg)}</td>
                          <td>{fmtBool(row.butuhRontgen ?? row.butuh_rontgen)}</td>
                          <td>{fmtBool(row.butuhCTScan ?? row.butuh_ct_scan)}</td>
                          <td>{fmtBool(row.butuhBiopsi ?? row.butuh_biopsi)}</td>
                          <td>{row.statusOperasi ?? row.status_operasi ?? '-'}</td>
                          <td>{row.jenisTindakan ?? row.jenis_tindakan ?? '-'}</td>
                          <td>{row.prioritas ?? '-'}</td>
                          <td>{formatDateJakarta(row.jadwalBedah ?? row.jadwal_bedah)}</td>
                          <td style={{ whiteSpace: 'pre-wrap' }}>{row.catatanBedah ?? row.catatan_bedah ?? row.catatan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <datalist id="dw-patient-options">
            {patientNameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>
    </DWLayout>
  )
}
