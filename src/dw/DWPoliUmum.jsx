import React, { useEffect, useState } from 'react'
import DWLayout from './DWLayout'
import { API_BASE_URL } from '../api'

export default function DWPoliUmum() {
  const [selectedTab, setSelectedTab] = useState('anamnesis')

  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false)
  const [anamnesisError, setAnamnesisError] = useState('')
  const [anamnesis, setAnamnesis] = useState([])

  const [loadingVital, setLoadingVital] = useState(false)
  const [vitalError, setVitalError] = useState('')
  const [vital, setVital] = useState([])
  const [hasLoadedVital, setHasLoadedVital] = useState(false)

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
    const load = async () => {
      setLoadingAnamnesis(true)
      setAnamnesisError('')
      try {
        const res = await fetch(`${API_BASE_URL}/anamnesis/warehouse`, { cache: 'no-store' })
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
        setAnamnesisError(e instanceof Error ? e.message : String(e))
        setAnamnesis([])
      } finally {
        if (mounted) setLoadingAnamnesis(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    if (selectedTab !== 'vital' || hasLoadedVital) return () => { mounted = false }

    const loadVital = async () => {
      setLoadingVital(true)
      setVitalError('')
      try {
        const res = await fetch(`${API_BASE_URL}/pemeriksaan_vital/warehouse`, { cache: 'no-store' })
        if (!mounted) return
        if (!res.ok) {
          setVitalError(`HTTP ${res.status} ${res.statusText}`)
          setVital([])
          return
        }
        const js = await res.json()
        const list = js?.data ?? js ?? []
        setVital(Array.isArray(list) ? list : [])
        setHasLoadedVital(true)
      } catch (e) {
        if (!mounted) return
        setVitalError(e instanceof Error ? e.message : String(e))
        setVital([])
      } finally {
        if (mounted) setLoadingVital(false)
      }
    }

    loadVital()
    return () => { mounted = false }
  }, [selectedTab, hasLoadedVital])

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
              <h2>Riwayat Anamnesis (Warehouse)</h2>
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
                      {anamnesis.map((row, idx) => (
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
              <h2>Riwayat Pemeriksaan Vital (Warehouse)</h2>
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
                      {vital.map((row, idx) => (
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
