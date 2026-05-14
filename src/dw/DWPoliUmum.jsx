import React, { useEffect, useState } from 'react'
import DWLayout from './DWLayout'
import { API_BASE_URL } from '../api'

export default function DWPoliUmum() {
  const [selectedTab, setSelectedTab] = useState('anamnesis')

  const [patients, setPatients] = useState([])
  const [patientQuery, setPatientQuery] = useState('')
  const [patientNik, setPatientNik] = useState('')

  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false)
  const [anamnesisError, setAnamnesisError] = useState('')
  const [anamnesis, setAnamnesis] = useState([])

  const [loadingVital, setLoadingVital] = useState(false)
  const [vitalError, setVitalError] = useState('')
  const [vital, setVital] = useState([])

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
      ? `${API_BASE_URL}/anamnesis/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/anamnesis/warehouse`

    const controller = new AbortController()
    const load = async () => {
      setLoadingAnamnesis(true)
      setAnamnesisError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setAnamnesisError(`HTTP ${res.status} ${res.statusText}`)
          setAnamnesis([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setAnamnesis(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setAnamnesisError(e instanceof Error ? e.message : String(e))
        setAnamnesis([])
      } finally {
        if (mounted) setLoadingAnamnesis(false)
      }
    }

    const t = setTimeout(load, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [patientNik])

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'vital') return () => { mounted = false }

    const nik = String(patientNik || '').trim()
    const url = nik
      ? `${API_BASE_URL}/pemeriksaan_vital/warehouse?NIK=${encodeURIComponent(nik)}`
      : `${API_BASE_URL}/pemeriksaan_vital/warehouse`

    const controller = new AbortController()

    const loadVital = async () => {
      setLoadingVital(true)
      setVitalError('')
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!mounted) return
        if (!res.ok) {
          setVitalError(`HTTP ${res.status} ${res.statusText}`)
          setVital([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setVital(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        if (e && typeof e === 'object' && e.name === 'AbortError') return
        setVitalError(e instanceof Error ? e.message : String(e))
        setVital([])
      } finally {
        if (mounted) setLoadingVital(false)
      }
    }

    const t = setTimeout(loadVital, 250)
    return () => {
      mounted = false
      clearTimeout(t)
      try { controller.abort() } catch (e) {}
    }
  }, [selectedTab, patientNik])

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
    // if searching by NIK, match exact resolved patient name only
    if (normalizedNik) {
      if (!matchedPatientByNik?.namaPasien) return []
      const target = String(matchedPatientByNik.namaPasien).trim().toLowerCase()
      return list.filter((row) => getRowPatientName(row).toLowerCase() === target)
    }
    return list.filter((row) => getRowPatientName(row).toLowerCase().includes(normalizedQuery))
  }

  const visibleAnamnesis = filterByPatientName(anamnesis)
  const visibleVital = filterByPatientName(vital)

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
          <h1 className="doctor-title">Data Warehouse RME-LINK - Poli Umum</h1>
          <p className="doctor-date">{formatDateJakarta(new Date())}</p>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setSelectedTab('anamnesis')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'anamnesis' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'anamnesis' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'anamnesis' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Anamnesis
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('vital')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: selectedTab === 'vital' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'vital' ? '#e6f2ff' : '#ffffff',
                color: selectedTab === 'vital' ? '#0b57d0' : '#374151',
                cursor: 'pointer'
              }}
            >
              Pemeriksaan Vital
            </button>
          </div>

          {selectedTab === 'anamnesis' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Anamnesis (Warehouse)</h2>
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
                  <datalist id="dw-patient-options">
                    {patientNameOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>
              {loadingAnamnesis && <div>Memuat riwayat...</div>}
              {anamnesisError && <div style={{ color: 'var(--error)' }}>{anamnesisError}</div>}

              {!loadingAnamnesis && !anamnesisError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 1100 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Text</th>
                        <th>Riwayat Pengobatan</th>
                        <th>Riwayat Keluarga</th>
                        <th>Riwayat Penyakit Dahulu</th>
                        <th>Riwayat Penyakit Lain</th>
                        <th>Riwayat Alergi</th>
                        <th>Status Kehamilan</th>
                        <th>Keluhan Utama</th>
                        <th>Keluhan Tambahan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAnamnesis.map((row, idx) => (
                        <tr key={row.id_anamnesis ? `${row.source}-${row.id_anamnesis}-${row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.date_make)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td style={{ whiteSpace: 'pre-wrap' }}>{row.text ?? '-'}</td>
                          <td>{row.riwayat_pengobatan ?? '-'}</td>
                          <td>{row.riwayat_keluarga ?? '-'}</td>
                          <td>{row.riwayat_penyakit_dahulu ?? '-'}</td>
                          <td>{row.riwayat_penyakit_lain ?? '-'}</td>
                          <td>{row.riwayat_alergi ?? '-'}</td>
                          <td>{row.status_kehamilan ?? '-'}</td>
                          <td>{row.keluhan_utama ?? '-'}</td>
                          <td>{row.keluhan_tambahan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTab === 'vital' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Riwayat Pemeriksaan Vital (Warehouse)</h2>
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
              {loadingVital && <div>Memuat riwayat...</div>}
              {vitalError && <div style={{ color: 'var(--error)' }}>{vitalError}</div>}

              {!loadingVital && !vitalError && (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="anamnesis-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Source</th>
                        <th>Nama Pasien</th>
                        <th>Tekanan Darah</th>
                        <th>Denyut Nadi</th>
                        <th>Suhu Tubuh</th>
                        <th>Frekuensi Napas</th>
                        <th>Berat Badan</th>
                        <th>Tinggi Badan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleVital.map((row, idx) => (
                        <tr key={(row.id_pemeriksaan_vital ?? row.id) ? `${row.source}-${row.id_pemeriksaan_vital ?? row.id}-${row.date_make ?? ''}` : idx}>
                          <td>{formatDateJakarta(row.date_make ?? row.tanggal ?? row.created_at)}</td>
                          <td>{row.source ?? '-'}</td>
                          <td>{row.nama_pasien ?? row.namaPasien ?? row.nama ?? '-'}</td>
                          <td>{row.tekanan_darah ?? '-'}</td>
                          <td>{row.denyut_nadi ?? '-'}</td>
                          <td>{row.suhu_tubuh ?? '-'}</td>
                          <td>{row.frekuensi_napas ?? '-'}</td>
                          <td>{row.berat_badan ?? '-'}</td>
                          <td>{row.tinggi_badan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DWLayout>
  )
}
