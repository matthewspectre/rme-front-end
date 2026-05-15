import React, { useEffect, useState } from 'react'
import DWLayout from './DWLayout'
import { API_BASE_URL } from '../api'

export default function DWPoliPenyakitDalam() {
  const [selectedTab, setSelectedTab] = useState('lab')

  const [etlLabLoading, setEtlLabLoading] = useState(false)
  const [etlLabError, setEtlLabError] = useState('')
  const [etlLabResult, setEtlLabResult] = useState(null)
  const [labRefreshKey, setLabRefreshKey] = useState(0)

  const [etlEkgLoading, setEtlEkgLoading] = useState(false)
  const [etlEkgError, setEtlEkgError] = useState('')
  const [etlEkgResult, setEtlEkgResult] = useState(null)
  const [ekgRefreshKey, setEkgRefreshKey] = useState(0)

  const [etlDiagnosisLoading, setEtlDiagnosisLoading] = useState(false)
  const [etlDiagnosisError, setEtlDiagnosisError] = useState('')
  const [etlDiagnosisResult, setEtlDiagnosisResult] = useState(null)
  const [diagnosisRefreshKey, setDiagnosisRefreshKey] = useState(0)

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

  const [loadingLab, setLoadingLab] = useState(false)
  const [labError, setLabError] = useState('')
  const [lab, setLab] = useState([])

  const [loadingEkg, setLoadingEkg] = useState(false)
  const [ekgError, setEkgError] = useState('')
  const [ekg, setEkg] = useState([])

  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false)
  const [diagnosisError, setDiagnosisError] = useState('')
  const [diagnosis, setDiagnosis] = useState([])

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
      ? `${API_BASE_URL}/pemeriksaan_laboratorium/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/pemeriksaan_laboratorium/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingLab(true)
      setLabError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setLabError(`HTTP ${res.status} ${res.statusText}`)
          setLab([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setLab(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setLabError(e instanceof Error ? e.message : String(e))
        setLab([])
      } finally {
        if (mounted) setLoadingLab(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [patientNik, labRefreshKey])

  const runEtlLab = async () => {
    if (!isDwAdmin) return
    setEtlLabLoading(true)
    setEtlLabError('')
    setEtlLabResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlLabResult(js)
      setLabRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlLabError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlLabLoading(false)
    }
  }

  const runEtlEkg = async () => {
    if (!isDwAdmin) return
    setEtlEkgLoading(true)
    setEtlEkgError('')
    setEtlEkgResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_ekg/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlEkgResult(js)
      setEkgRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlEkgError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlEkgLoading(false)
    }
  }

  const runEtlDiagnosis = async () => {
    if (!isDwAdmin) return
    setEtlDiagnosisLoading(true)
    setEtlDiagnosisError('')
    setEtlDiagnosisResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/diagnosis/etl`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
      }
      const js = await res.json().catch(() => ({}))
      setEtlDiagnosisResult(js)
      setDiagnosisRefreshKey((n) => n + 1)
    } catch (e) {
      setEtlDiagnosisError(e instanceof Error ? e.message : String(e))
    } finally {
      setEtlDiagnosisLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'ekg') return () => { mounted = false }

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/pemeriksaan_ekg/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/pemeriksaan_ekg/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingEkg(true)
      setEkgError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setEkgError(`HTTP ${res.status} ${res.statusText}`)
          setEkg([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setEkg(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setEkgError(e instanceof Error ? e.message : String(e))
        setEkg([])
      } finally {
        if (mounted) setLoadingEkg(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [selectedTab, patientNik, ekgRefreshKey])

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'diagnosis') return () => { mounted = false }

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/diagnosis/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/diagnosis/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingDiagnosis(true)
      setDiagnosisError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setDiagnosisError(`HTTP ${res.status} ${res.statusText}`)
          setDiagnosis([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setDiagnosis(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setDiagnosisError(e instanceof Error ? e.message : String(e))
        setDiagnosis([])
      } finally {
        if (mounted) setLoadingDiagnosis(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [selectedTab, patientNik, diagnosisRefreshKey])

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

  const visibleLab = filterByPatientName(lab)
  const visibleEkg = filterByPatientName(ekg)
  const visibleDiagnosis = filterByPatientName(diagnosis)

  const patientNameOptions = Array.from(
    new Set(
      (Array.isArray(patients) ? patients : [])
        .map((p) => String(p?.namaPasien ?? '').trim())
        .filter(Boolean)
        .filter((name) => (normalizedQuery ? name.toLowerCase().includes(normalizedQuery) : true))
    )
  ).slice(0, 30)

  return (
    <DWLayout>
      <div className="doctor-header">
        <div>
          <h1 className="doctor-title">Data Warehouse RME-LINK - Poli Penyakit Dalam</h1>
          <p className="doctor-date">{formatDateJakarta(new Date())}</p>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setSelectedTab('lab')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'lab' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'lab' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'lab' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Pemeriksaan Laboratorium
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('ekg')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'ekg' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'ekg' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'ekg' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Pemeriksaan EKG
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('diagnosis')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'diagnosis' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'diagnosis' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'diagnosis' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Catatan Diagnosis
            </button>
          </div>

          {selectedTab === 'lab' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Pemeriksaan Laboratorium</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlLab}
                      disabled={etlLabLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlLabLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlLabLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlLabLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlLabError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlLabError}</div>}
                  {etlLabResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlLabResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlLabResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlLabResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Pemeriksaan Laboratorium (Warehouse)</h2>
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
              {loadingLab && <div>Memuat riwayat...</div>}
              {labError && <div style={{ color: 'var(--error)' }}>{labError}</div>}

              {!loadingLab && !labError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 2000 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>HB</th>
                        <th>HT</th>
                        <th>Leukosit</th>
                        <th>Trombosit</th>
                        <th>Gula Puasa</th>
                        <th>Gula Sewaktu</th>
                        <th>HBA1c</th>
                        <th>Kolesterol Total</th>
                        <th>HDL</th>
                        <th>LDL</th>
                        <th>Trigliserida</th>
                        <th>SGOT</th>
                        <th>SGPT</th>
                        <th>Ureum</th>
                        <th>Kreatinin</th>
                        <th>Asam Urat</th>
                        <th>Natrium</th>
                        <th>Kalium</th>
                        <th>Klorida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLab.map((row, idx) => (
                        <tr key={(row.id_pemeriksaan_laboratorium ?? row.id) ? `${row.source ?? ''}-${row.id_pemeriksaan_laboratorium ?? row.id}-${row.waktu ?? row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.waktu ?? row.date_make ?? row.dateMake ?? row.createdAt)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{row.hb ?? '-'}</td>
                          <td>{row.ht ?? '-'}</td>
                          <td>{row.leukosit ?? '-'}</td>
                          <td>{row.trombosit ?? '-'}</td>
                          <td>{row.gulaPuasa ?? row.gula_puasa ?? '-'}</td>
                          <td>{row.gulaSewaktu ?? row.gula_sewaktu ?? '-'}</td>
                          <td>{row.hba1c ?? '-'}</td>
                          <td>{row.kolesterolTotal ?? row.kolesterol_total ?? '-'}</td>
                          <td>{row.hdl ?? '-'}</td>
                          <td>{row.ldl ?? '-'}</td>
                          <td>{row.trigliserida ?? '-'}</td>
                          <td>{row.sgot ?? '-'}</td>
                          <td>{row.sgpt ?? '-'}</td>
                          <td>{row.ureum ?? '-'}</td>
                          <td>{row.kreatinin ?? '-'}</td>
                          <td>{row.asamUrat ?? row.asam_urat ?? '-'}</td>
                          <td>{row.natrium ?? '-'}</td>
                          <td>{row.kalium ?? '-'}</td>
                          <td>{row.klorida ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTab === 'ekg' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Pemeriksaan EKG</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlEkg}
                      disabled={etlEkgLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlEkgLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlEkgLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlEkgLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlEkgError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlEkgError}</div>}
                  {etlEkgResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlEkgResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlEkgResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlEkgResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Pemeriksaan EKG (Warehouse)</h2>
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
              {loadingEkg && <div>Memuat riwayat...</div>}
              {ekgError && <div style={{ color: 'var(--error)' }}>{ekgError}</div>}

              {!loadingEkg && !ekgError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1500 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Detak Jantung</th>
                        <th>Irama</th>
                        <th>PR Interval</th>
                        <th>QRS Duration</th>
                        <th>QT/QTC</th>
                        <th>Axis Jantung</th>
                        <th>ST Elev/Dep</th>
                        <th>T-wave Abnormality</th>
                        <th>Interpretasi Dokter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEkg.map((row, idx) => (
                        <tr key={(row.id_pemeriksaan_ekg ?? row.id) ? `${row.source ?? ''}-${row.id_pemeriksaan_ekg ?? row.id}-${row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.dateMake ?? row.date_make ?? row.waktu ?? row.createdAt)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{row.detakJantung ?? row.detak_jantung ?? '-'}</td>
                          <td>{row.irama ?? '-'}</td>
                          <td>{row.prInterval ?? row.pr_interval ?? '-'}</td>
                          <td>{row.qrsDuration ?? row.qrs_duration ?? '-'}</td>
                          <td>{row.qt_qtc_interval ?? row.qt_qtc ?? '-'}</td>
                          <td>{row.axisJantung ?? row.axis_jantung ?? '-'}</td>
                          <td>{row.st_elevation_depression ?? '-'}</td>
                          <td>{row.t_wave_abnormality ?? '-'}</td>
                          <td>{row.interpretasi_dokter ?? row.interpretasiDokter ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTab === 'diagnosis' && (
            <>
              {isDwAdmin && (
                <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e6eef8', borderRadius: 10, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Proses ETL Catatan Diagnosis</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Klik untuk menarik data baru ke warehouse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={runEtlDiagnosis}
                      disabled={etlDiagnosisLoading}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e6eef8',
                        background: etlDiagnosisLoading ? '#f1f5f9' : '#ffffff',
                        color: '#111827',
                        cursor: etlDiagnosisLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {etlDiagnosisLoading ? 'Memproses...' : 'Jalankan ETL'}
                    </button>
                  </div>
                  {etlDiagnosisError && <div style={{ marginTop: 10, color: 'var(--error)' }}>{etlDiagnosisError}</div>}
                  {etlDiagnosisResult && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>
                      <div><b>Message:</b> {etlDiagnosisResult.message ?? '-'}</div>
                      <div><b>Inserted RS A:</b> {etlDiagnosisResult.inserted_rs_a ?? '-'}</div>
                      <div><b>Inserted RS B:</b> {etlDiagnosisResult.inserted_rs_b ?? '-'}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Catatan Diagnosis (Warehouse)</h2>
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
              {loadingDiagnosis && <div>Memuat riwayat...</div>}
              {diagnosisError && <div style={{ color: 'var(--error)' }}>{diagnosisError}</div>}

              {!loadingDiagnosis && !diagnosisError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1400 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Diagnosa Utama</th>
                        <th>Diagnosa Sekunder</th>
                        <th>Diagnosis Banding</th>
                        <th>Dasar Diagnosis</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDiagnosis.map((row, idx) => {
                        const utama = (row?.diagnosis_utama && (row.diagnosis_utama.nama || row.diagnosis_utama.kode_icd))
                          ? (row.diagnosis_utama.nama || row.diagnosis_utama.kode_icd)
                          : (row.diagnosa ?? row.diagnosis_utama ?? '-')

                        const sekunderRaw = row?.diagnosis_sekunder
                        const sekunder = Array.isArray(sekunderRaw)
                          ? sekunderRaw.map((s) => (s && (s.nama || s.kode_icd) ? (s.nama || s.kode_icd) : String(s))).join(', ')
                          : (sekunderRaw ? String(sekunderRaw) : '-')

                        const bandingRaw = row?.diagnosis_banding
                        const banding = Array.isArray(bandingRaw) ? bandingRaw.map((b) => String(b)).join(', ') : (bandingRaw ? String(bandingRaw) : '-')

                        const dasarRaw = row?.dasar_diagnosis
                        const dasar = Array.isArray(dasarRaw) ? dasarRaw.map((d) => String(d)).join(', ') : (dasarRaw ? String(dasarRaw) : '-')

                        return (
                          <tr key={(row.id_diagnosis ?? row.id) ? `${row.source ?? ''}-${row.id_diagnosis ?? row.id}-${row.tanggal ?? row.waktu ?? ''}` : idx}>
                            <td>{formatDateJakarta(row.tanggal ?? row.waktu ?? row.createdAt ?? row.date_make)}</td>
                            <td>{row.source ?? '-'}</td>
                            <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                            <td>{utama}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{sekunder}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{banding}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{dasar}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{row.catatan ?? '-'}</td>
                          </tr>
                        )
                      })}
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
