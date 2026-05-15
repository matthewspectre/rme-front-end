import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function PoliBedah() {
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

  const [selectedTab, setSelectedTab] = useState('lokalis')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [lokalisForm, setLokalisForm] = useState({
    lokasiKelainan: '', jenisKelainan: '', ukuran: '', warna: '', nyeriTekan: false,
    konsistensi: '', mobilitas: '', tandaRadang: false, fluktuasi: false, catatan: '',
  })
  const [isSubmittingLokalis, setIsSubmittingLokalis] = useState(false)
  const [lokalisMessage, setLokalisMessage] = useState('')
  const [lokalisError, setLokalisError] = useState('')
  // Fungsi Organ form state
  const [fungsiForm, setFungsiForm] = useState({
    gangguanBAB: false,
    gangguanBAK: false,
    mualMuntah: false,
    demam: false,
    perdarahan: false,
    penurunanBB: false,
    gangguanGerak: false,
    catatan: '',
  })
  const [isSubmittingFungsi, setIsSubmittingFungsi] = useState(false)
  const [fungsiMessage, setFungsiMessage] = useState('')
  const [fungsiError, setFungsiError] = useState('')
  const [fungsiHistory, setFungsiHistory] = useState([])
  const [fungsiHistoryError, setFungsiHistoryError] = useState('')

  // Penunjang Bedah form state
  const [penunjangForm, setPenunjangForm] = useState({
    butuhUSG: false,
    butuhRontgen: false,
    butuhCTScan: false,
    butuhBiopsi: false,
    statusOperasi: '',
    jenisTindakan: '',
    prioritas: '',
    catatanBedah: '',
    jadwalBedah: '',
  })
  const [isSubmittingPenunjang, setIsSubmittingPenunjang] = useState(false)
  const [penunjangMessage, setPenunjangMessage] = useState('')
  const [penunjangError, setPenunjangError] = useState('')
  const [penunjangHistory, setPenunjangHistory] = useState([])
  const [loadingPenunjangHistory, setLoadingPenunjangHistory] = useState(false)
  const [penunjangHistoryError, setPenunjangHistoryError] = useState('')

  const fetchFungsiHistory = async (pid) => {
    setFungsiHistoryError('')
    if (!pid) {
      setFungsiHistory([])
      return
    }
    const url = `${API_BASE_URL}/pemeriksaan_fungsi_organ?idPasien=${encodeURIComponent(pid)}`
    try {
      const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`)
      }
      const data = await res.json()
      setFungsiHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('fetchFungsiHistory error', err)
      setFungsiHistoryError(String(err.message || err))
      setFungsiHistory([])
    }
  }

  useEffect(() => {
    const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian?.[0]?.idPasien ?? antrian?.[0]?.id
    fetchFungsiHistory(idPasien)
  }, [selectedPatient, antrian])
  const [lokalisHistory, setLokalisHistory] = useState([])
  const [loadingLokalisHistory, setLoadingLokalisHistory] = useState(false)
  const [lokalisHistoryError, setLokalisHistoryError] = useState('')

  const fetchLokalisHistory = async (maybePid) => {
    setLokalisHistoryError('')
    setLoadingLokalisHistory(true)
    try {
      const idPasien = maybePid || (selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id)
      if (!idPasien) {
        setLokalisHistory([])
        return
      }
      const candidates = [
        `${API_BASE_URL}/lokalis_bedah?idPasien=${encodeURIComponent(idPasien)}`,
        `${API_BASE_URL}/lokalis_bedah/?idPasien=${encodeURIComponent(idPasien)}`,
        `${API_BASE_URL}/lokalis-bedah?idPasien=${encodeURIComponent(idPasien)}`,
        `${API_BASE_URL}/lokalis-bedah/?idPasien=${encodeURIComponent(idPasien)}`,
      ]
      let res = null
      let lastErr = null
      for (const u of candidates) {
        try {
          const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (r && r.ok) { res = r; break }
          if (r && r.status === 404) { lastErr = `404 Not Found @ ${u}`; continue }
          const txt = await r.text().catch(() => '')
          lastErr = `HTTP ${r.status} ${r.statusText} - ${txt} @ ${u}`
          break
        } catch (e) {
          lastErr = String(e.message || e)
        }
      }
      if (!res) {
        throw new Error(lastErr || 'Gagal menghubungi server proxy. Pastikan Vite dev server dijalankan dan proxy `/api` dikonfigurasi.')
      }
      const data = await res.json()
      setLokalisHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setLokalisHistory([])
      setLokalisHistoryError(String(e.message || e))
    } finally {
      setLoadingLokalisHistory(false)
    }
  }

  useEffect(() => {
    // load history when selected patient changes
    try {
      const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id
      if (!pid) {
        setLokalisHistory([])
        return
      }
      fetchLokalisHistory(pid)
    } catch (e) {
      // ignore
    }
  }, [selectedPatient, antrian])

  const renderLokalisHistory = () => {
    if (loadingLokalisHistory) return <div style={{ color: '#64748b' }}>Memuat riwayat...</div>
    if (lokalisHistoryError) return <div style={{ color: '#b91c1c' }}>{lokalisHistoryError}</div>
    if (!lokalisHistory || lokalisHistory.length === 0) return <div style={{ color: '#64748b' }}>Belum ada riwayat lokalis untuk pasien ini.</div>

    const fmtBool = (v) => (v === null || typeof v === 'undefined') ? '-' : (v ? 'Ya' : 'Tidak')
    const fmtText = (v) => (v === null || typeof v === 'undefined' || v === '') ? '-' : String(v)
    const fmtDate = (d) => {
      if (!d) return '-'
      try { const dt = new Date(d); return isNaN(dt.getTime()) ? '-' : dt.toLocaleString('id-ID') } catch (e) { return '-' }
    }

    return (
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table className="anamnesis-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
              <th style={{ padding: '8px', width: '8%' }}>Aksi</th>
              <th style={{ padding: '8px', width: '12%' }}>Tanggal</th>
              <th style={{ padding: '8px', width: '12%' }}>Lokasi</th>
              <th style={{ padding: '8px', width: '12%' }}>Jenis</th>
              <th style={{ padding: '8px', width: '8%' }}>Ukuran</th>
              <th style={{ padding: '8px', width: '8%' }}>Warna</th>
              <th style={{ padding: '8px', width: '6%' }}>Nyeri Tekan</th>
              <th style={{ padding: '8px', width: '12%' }}>Konsistensi</th>
              <th style={{ padding: '8px', width: '12%' }}>Mobilitas</th>
              <th style={{ padding: '8px', width: '6%' }}>Tanda Radang</th>
              <th style={{ padding: '8px', width: '6%' }}>Fluktuasi</th>
              <th style={{ padding: '8px', width: '12%' }}>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {lokalisHistory.map((it, idx) => (
              <tr key={it.id ?? `lokalis-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td className="actions-cell" style={{ padding: '8px', verticalAlign: 'top', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button type="button" className="btn-ubah" onClick={() => {
                    const entryId = it.id ?? it._id ?? it.id_lokalis ?? it.idPasien ?? null
                    openEditLokalis(entryId)
                  }}>UBAH</button>
                  <button
                    type="button"
                    className="btn-hapus"
                    onClick={() => {
                      const entryId = it.id ?? it._id ?? it.id_lokalis ?? it.idPasien ?? null
                      showConfirm({ title: 'Konfirmasi', message: 'Yakin ingin menyembunyikan entri ini?', onConfirm: () => patchHideLokalis(entryId) })
                    }}
                  >HAPUS</button>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtDate(it.tanggal)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word' }}>{fmtText(it.lokasiKelainan ?? it.lokasi)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(it.jenisKelainan ?? it.jenis)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(it.ukuran)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(it.warna)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(it.nyeriTekan)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(it.konsistensi)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(it.mobilitas)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(it.tandaRadang)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(it.fluktuasi)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word' }}>{fmtText(it.catatan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderFungsiHistory = () => {
    if (!fungsiHistory) return null
    if (fungsiHistory.length === 0) return <div style={{ color: '#64748b' }}>Belum ada riwayat pemeriksaan fungsi organ.</div>

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: '8px 0' }}>Riwayat Pemeriksaan Fungsi Organ</h4>
        </div>
        <div style={{ marginTop: 8, overflowX: 'auto' }}>
          <table className="anamnesis-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                <th style={{ padding: '8px', width: '8%' }}>Aksi</th>
                <th style={{ padding: '8px', width: '12%' }}>Tanggal</th>
                <th style={{ padding: '8px', width: '8%' }}>BAB</th>
                <th style={{ padding: '8px', width: '8%' }}>BAK</th>
                <th style={{ padding: '8px', width: '8%' }}>Mual/Muntah</th>
                <th style={{ padding: '8px', width: '8%' }}>Demam</th>
                <th style={{ padding: '8px', width: '8%' }}>Perdarahan</th>
                <th style={{ padding: '8px', width: '8%' }}>Penurunan BB</th>
                <th style={{ padding: '8px', width: '8%' }}>Gangguan Gerak</th>
                <th style={{ padding: '8px', width: '24%' }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {fungsiHistory.slice().sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).map((entry, idx) => (
                <tr key={entry.id ?? `fungs-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="actions-cell" style={{ padding: '8px', verticalAlign: 'top', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button type="button" className="btn-ubah" onClick={() => openEditFungsi(entry.id ?? entry._id ?? null)}>UBAH</button>
                    <button type="button" className="btn-hapus" onClick={() => showConfirm({ title: 'Konfirmasi', message: 'Yakin ingin menyembunyikan entri ini?', onConfirm: () => patchHideFungsi(entry.id ?? entry._id ?? null) })}>HAPUS</button>
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{entry.tanggal ? new Date(entry.tanggal).toLocaleString('id-ID') : '-'}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.gangguanBAB === null || typeof entry.gangguanBAB === 'undefined') ? '-' : (entry.gangguanBAB ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.gangguanBAK === null || typeof entry.gangguanBAK === 'undefined') ? '-' : (entry.gangguanBAK ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.mualMuntah === null || typeof entry.mualMuntah === 'undefined') ? '-' : (entry.mualMuntah ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.demam === null || typeof entry.demam === 'undefined') ? '-' : (entry.demam ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.perdarahan === null || typeof entry.perdarahan === 'undefined') ? '-' : (entry.perdarahan ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.penurunanBB === null || typeof entry.penurunanBB === 'undefined') ? '-' : (entry.penurunanBB ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{(entry.gangguanGerak === null || typeof entry.gangguanGerak === 'undefined') ? '-' : (entry.gangguanGerak ? 'Ya' : 'Tidak')}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word' }}>{entry.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const fetchPenunjangHistory = async (maybePid) => {
    setPenunjangHistoryError('')
    setLoadingPenunjangHistory(true)
    try {
      const idPasien = maybePid || (selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id)
      if (!idPasien) {
        setPenunjangHistory([])
        return
      }

      const candidates = [
        `${API_BASE_URL}/pemeriksaan_penunjang_bedah?idPasien=${encodeURIComponent(idPasien)}`,
        `/pemeriksaan_penunjang_bedah?idPasien=${encodeURIComponent(idPasien)}`,
        `http://localhost:8080/pemeriksaan_penunjang_bedah?idPasien=${encodeURIComponent(idPasien)}`,
      ]

      let res = null
      let lastErr = null
      for (const u of candidates) {
        try {
          const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (r && r.ok) { res = r; break }
          if (r && r.status === 404) { lastErr = `404 Not Found @ ${u}`; continue }
          const txt = await r.text().catch(() => '')
          lastErr = `HTTP ${r.status} ${r.statusText} - ${txt} @ ${u}`
          break
        } catch (e) {
          lastErr = String(e.message || e)
        }
      }
      if (!res) {
        throw new Error(lastErr || 'Gagal menghubungi server penunjang. Pastikan backend berjalan dan dev server dijalankan.')
      }
      const data = await res.json()
      setPenunjangHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setPenunjangHistory([])
      setPenunjangHistoryError(String(e.message || e))
    } finally {
      setLoadingPenunjangHistory(false)
    }
  }

  useEffect(() => {
    try {
      const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id
      if (!pid) { setPenunjangHistory([]); return }
      fetchPenunjangHistory(pid)
    } catch (e) {
      // ignore
    }
  }, [selectedPatient, antrian])

  const renderPenunjangHistory = () => {
    if (loadingPenunjangHistory) return <div style={{ color: '#64748b' }}>Memuat riwayat...</div>
    if (penunjangHistoryError) return <div style={{ color: '#b91c1c' }}>{penunjangHistoryError}</div>
    if (!penunjangHistory || penunjangHistory.length === 0) return <div style={{ color: '#64748b' }}>Belum ada riwayat penunjang bedah untuk pasien ini.</div>

    const fmtBool = (v) => (v === null || typeof v === 'undefined') ? '-' : (v ? 'Ya' : 'Tidak')
    const fmtText = (v) => (v === null || typeof v === 'undefined' || v === '') ? '-' : String(v)
    const fmtDate = (d) => {
      if (!d) return '-'
      try { const dt = new Date(d); return isNaN(dt.getTime()) ? '-' : dt.toLocaleString('id-ID') } catch (e) { return '-' }
    }

    return (
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table className="anamnesis-table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
              <th style={{ padding: '8px', width: '8%' }}>Aksi</th>
              <th style={{ padding: '8px', width: '12%' }}>Jadwal</th>
              <th style={{ padding: '8px', width: '6%' }}>USG</th>
              <th style={{ padding: '8px', width: '6%' }}>Rontgen</th>
              <th style={{ padding: '8px', width: '6%' }}>CTScan</th>
              <th style={{ padding: '8px', width: '6%' }}>Biopsi</th>
              <th style={{ padding: '8px', width: '12%' }}>Status Operasi</th>
              <th style={{ padding: '8px', width: '12%' }}>Jenis Tindakan</th>
              <th style={{ padding: '8px', width: '8%' }}>Prioritas</th>
              <th style={{ padding: '8px', width: '22%' }}>Catatan Bedah</th>
            </tr>
          </thead>
          <tbody>
            {penunjangHistory.slice().sort((a, b) => new Date(b.jadwalBedah || b.tanggal || 0) - new Date(a.jadwalBedah || a.tanggal || 0)).map((entry, idx) => (
              <tr key={entry.id ?? `penunjang-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td className="actions-cell" style={{ padding: '8px', verticalAlign: 'top', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button type="button" className="btn-ubah" onClick={() => openEditPenunjang(entry.id ?? entry._id ?? null)}>UBAH</button>
                  <button type="button" className="btn-hapus" onClick={() => showConfirm({ title: 'Konfirmasi', message: 'Yakin ingin menyembunyikan entri ini?', onConfirm: () => patchHidePenunjang(entry.id ?? entry._id ?? null) })}>HAPUS</button>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtDate(entry.jadwalBedah)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(entry.butuhUSG)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(entry.butuhRontgen)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(entry.butuhCTScan)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtBool(entry.butuhBiopsi)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(entry.statusOperasi)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(entry.jenisTindakan)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{fmtText(entry.prioritas)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word' }}>{fmtText(entry.catatanBedah)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // confirmation modal render (match PoliPenyakitDalam style)
  

  // confirmation modal state (for hide/delete actions)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const confirmCallback = React.useRef(null)

  const showConfirm = ({ title = 'Peringatan', message = '', onConfirm = null }) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    confirmCallback.current = onConfirm
    setConfirmVisible(true)
  }

  const handleConfirmYes = () => {
    setConfirmVisible(false)
    const cb = confirmCallback.current
    confirmCallback.current = null
    if (cb) cb()
  }

  const handleConfirmNo = () => {
    setConfirmVisible(false)
    confirmCallback.current = null
  }

  // hover + selesai states
  const [hoveredPatientId, setHoveredPatientId] = useState(null)
  const hoverTimer = React.useRef(null)
  const [isMarkingSelesai, setIsMarkingSelesai] = useState(false)
  const [markingId, setMarkingId] = useState(null)

  const handleMarkSelesai = async () => {
    try {
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) {
        alert('Pilih pasien terlebih dahulu untuk menandai selesai')
        return
      }
      setMarkingId(pid)
      setIsMarkingSelesai(true)
      setAntrian(prev => prev.filter(it => String(it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id) !== String(pid)))

      const proxyUrls = [
        `${API_BASE_URL}/antrian/patient/${encodeURIComponent(pid)}/`,
        `${API_BASE_URL}/antrian/patient/${encodeURIComponent(pid)}`
      ]
      const backendUrls = [
        `http://localhost:8080/antrian/patient/${encodeURIComponent(pid)}/`,
        `http://localhost:8080/antrian/patient/${encodeURIComponent(pid)}`
      ]
      const urls = [...proxyUrls, ...backendUrls]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'DELETE', credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) { success = true; break }
          lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!success) {
        console.warn('Gagal menghapus antrian pasien di server', lastErr)
        alert('Gagal menghapus antrian di server: ' + String(lastErr))
      }
    } catch (e) {
      console.error('handleMarkSelesai error', e)
    } finally {
      setIsMarkingSelesai(false)
      setMarkingId(null)
    }
  }

  const patchHideLokalis = async (entryId) => {
    if (!entryId) { setLokalisError('ID entri tidak tersedia'); return }
    try {
      const u = `${API_BASE_URL}/lokalis_bedah/${encodeURIComponent(entryId)}/hide`
      const r = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json' } })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      setLokalisMessage('Entri berhasil disembunyikan')
      try { await fetchLokalisHistory(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setLokalisError(String(e.message || e))
    }
  }

  // --- Edit (UBAH) modal state and handlers ---
  const [editVisible, setEditVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    id: null,
    id_pasien: null,
    id_dokter: null,
    tanggal: '',
    lokasiKelainan: '', jenisKelainan: '', ukuran: '', warna: '', nyeriTekan: false,
    konsistensi: '', mobilitas: '', tandaRadang: false, fluktuasi: false, catatan: '',
  })
  const [editError, setEditError] = useState('')

  // --- Fungsi Organ edit modal state ---
  const [editFungsiVisible, setEditFungsiVisible] = useState(false)
  const [editFungsiLoading, setEditFungsiLoading] = useState(false)
  const [isSubmittingEditFungsi, setIsSubmittingEditFungsi] = useState(false)
  const [editFungsiForm, setEditFungsiForm] = useState({
    id: null,
    id_pasien: null,
    id_dokter: null,
    tanggal: '',
    gangguanBAB: false,
    gangguanBAK: false,
    mualMuntah: false,
    demam: false,
    perdarahan: false,
    penurunanBB: false,
    gangguanGerak: false,
    catatan: '',
  })
  const [editFungsiError, setEditFungsiError] = useState('')

  const openEditLokalis = async (entryId) => {
    if (!entryId) { setEditError('ID entri tidak tersedia'); return }
    setEditError('')
    setEditLoading(true)
    try {
      const u = `${API_BASE_URL}/lokalis_bedah/${encodeURIComponent(entryId)}`
      const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      const data = await r.json()
      const d = Array.isArray(data) ? data[0] : data
      setEditForm({
        id: d?.id ?? d?._id ?? entryId,
        id_pasien: d?.id_pasien ?? d?.idPasien ?? d?.idPasien ?? null,
        id_dokter: d?.id_dokter ?? d?.idDokter ?? d?.id_dokter ?? null,
        tanggal: d?.tanggal ?? '',
        lokasiKelainan: d?.lokasiKelainan ?? d?.lokasi ?? '',
        jenisKelainan: d?.jenisKelainan ?? d?.jenis ?? '',
        ukuran: d?.ukuran ?? '',
        warna: d?.warna ?? '',
        nyeriTekan: !!d?.nyeriTekan,
        konsistensi: d?.konsistensi ?? '',
        mobilitas: d?.mobilitas ?? '',
        tandaRadang: !!d?.tandaRadang,
        fluktuasi: !!d?.fluktuasi,
        catatan: d?.catatan ?? '',
      })
      setEditVisible(true)
    } catch (e) {
      console.error(e)
      setEditError(String(e.message || e))
    } finally {
      setEditLoading(false)
    }
  }

  const openEditFungsi = async (entryId) => {
    if (!entryId) { setEditFungsiError('ID entri tidak tersedia'); return }
    setEditFungsiError('')
    setEditFungsiLoading(true)
    try {
      const u = `${API_BASE_URL}/pemeriksaan_fungsi_organ/${encodeURIComponent(entryId)}`
      const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      const data = await r.json()
      const d = Array.isArray(data) ? data[0] : data
      setEditFungsiForm({
        id: d?.id ?? d?._id ?? entryId,
        id_pasien: d?.id_pasien ?? d?.idPasien ?? null,
        id_dokter: d?.id_dokter ?? d?.idDokter ?? null,
        tanggal: d?.tanggal ?? '',
        gangguanBAB: !!d?.gangguanBAB,
        gangguanBAK: !!d?.gangguanBAK,
        mualMuntah: !!d?.mualMuntah,
        demam: !!d?.demam,
        perdarahan: !!d?.perdarahan,
        penurunanBB: !!d?.penurunanBB,
        gangguanGerak: !!d?.gangguanGerak,
        catatan: d?.catatan ?? '',
      })
      setEditFungsiVisible(true)
    } catch (e) {
      console.error(e)
      setEditFungsiError(String(e.message || e))
    } finally {
      setEditFungsiLoading(false)
    }
  }

  const submitEditFungsi = async (e) => {
    e && e.preventDefault && e.preventDefault()
    setEditFungsiError('')
    setIsSubmittingEditFungsi(true)
    try {
      const id = editFungsiForm.id
      if (!id) throw new Error('ID entri tidak diketahui')
      // prefer proxied API, but backend expects snake_case keys; fallback to localhost if proxy fails
      const idEnc = encodeURIComponent(id)
      const urls = [
        `${API_BASE_URL}/pemeriksaan_fungsi_organ/${idEnc}`,
        `http://localhost:8080/pemeriksaan_fungsi_organ/${idEnc}`,
      ]

      const payload = {
        gangguan_bab: !!editFungsiForm.gangguanBAB,
        gangguan_bak: !!editFungsiForm.gangguanBAK,
        mual_muntah: !!editFungsiForm.mualMuntah,
        demam: !!editFungsiForm.demam,
        perdarahan: !!editFungsiForm.perdarahan,
        penurunan_bb: !!editFungsiForm.penurunanBB,
        gangguan_gerak: !!editFungsiForm.gangguanGerak,
        catatan: editFungsiForm.catatan,
      }

      let lastErr = null
      let resp = null
      for (const u of urls) {
        try {
          resp = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
          if (resp && resp.ok) break
          const txt = await resp.text().catch(() => '')
          lastErr = `HTTP ${resp.status} ${resp.statusText} - ${txt} @ ${u}`
          resp = null
          // try next
        } catch (err) {
          lastErr = String(err.message || err)
          resp = null
        }
      }
      if (!resp) throw new Error(lastErr || 'Gagal menghubungi server untuk memperbarui entri fungsi organ')
      // response already checked above
      setEditFungsiVisible(false)
      setFungsiMessage('Entri fungsi organ berhasil diperbarui')
      try { await fetchFungsiHistory(editFungsiForm.id_pasien ?? selectedPatient?.id) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setEditFungsiError(String(e.message || e))
    } finally {
      setIsSubmittingEditFungsi(false)
    }
  }

  const patchHideFungsi = async (entryId) => {
    if (!entryId) { setFungsiError('ID entri tidak tersedia'); return }
    try {
      const u = `${API_BASE_URL}/pemeriksaan_fungsi_organ/${encodeURIComponent(entryId)}/hide`
      const r = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json' } })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      setFungsiMessage('Entri fungsi organ berhasil disembunyikan')
      try { await fetchFungsiHistory(selectedPatient?.id ?? selectedPatient?.idPasien) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setFungsiError(String(e.message || e))
    }
  }

  // --- Penunjang edit modal state and handlers ---
  const [editPenunjangVisible, setEditPenunjangVisible] = useState(false)
  const [editPenunjangLoading, setEditPenunjangLoading] = useState(false)
  const [isSubmittingEditPenunjang, setIsSubmittingEditPenunjang] = useState(false)
  const [editPenunjangForm, setEditPenunjangForm] = useState({
    id: null,
    id_pasien: null,
    id_dokter: null,
    tanggal: '',
    butuhUSG: false,
    butuhRontgen: false,
    butuhCTScan: false,
    butuhBiopsi: false,
    statusOperasi: '',
    jenisTindakan: '',
    prioritas: '',
    catatanBedah: '',
    jadwalBedah: '',
  })
  const [editPenunjangError, setEditPenunjangError] = useState('')

  const openEditPenunjang = async (entryId) => {
    if (!entryId) { setEditPenunjangError('ID entri tidak tersedia'); return }
    setEditPenunjangError('')
    setEditPenunjangLoading(true)
    try {
      const u = `${API_BASE_URL}/pemeriksaan_penunjang_bedah/${encodeURIComponent(entryId)}`
      const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      const data = await r.json()
      const d = Array.isArray(data) ? data[0] : data
      setEditPenunjangForm({
        id: d?.id ?? d?._id ?? entryId,
        id_pasien: d?.id_pasien ?? d?.idPasien ?? null,
        id_dokter: d?.id_dokter ?? d?.idDokter ?? null,
        tanggal: d?.tanggal ?? '',
        butuhUSG: !!d?.butuhUSG,
        butuhRontgen: !!d?.butuhRontgen,
        butuhCTScan: !!d?.butuhCTScan,
        butuhBiopsi: !!d?.butuhBiopsi,
        statusOperasi: d?.statusOperasi ?? d?.status_operasi ?? '',
        jenisTindakan: d?.jenisTindakan ?? d?.jenis_tindakan ?? '',
        prioritas: d?.prioritas ?? '',
        catatanBedah: d?.catatanBedah ?? d?.catatan_bedah ?? '',
        jadwalBedah: d?.jadwalBedah ?? d?.jadwal_bedah ?? '',
      })
      setEditPenunjangVisible(true)
    } catch (e) {
      console.error(e)
      setEditPenunjangError(String(e.message || e))
    } finally {
      setEditPenunjangLoading(false)
    }
  }

  const submitEditPenunjang = async (e) => {
    e && e.preventDefault && e.preventDefault()
    setEditPenunjangError('')
    setIsSubmittingEditPenunjang(true)
    try {
      const id = editPenunjangForm.id
      if (!id) throw new Error('ID entri tidak diketahui')
      const idEnc = encodeURIComponent(id)
      const urls = [
        `${API_BASE_URL}/pemeriksaan_penunjang_bedah/${idEnc}`,
        `http://localhost:8080/pemeriksaan_penunjang_bedah/${idEnc}`,
      ]

      const payload = {
        butuh_usg: !!editPenunjangForm.butuhUSG,
        butuh_rontgen: !!editPenunjangForm.butuhRontgen,
        butuh_ctscan: !!editPenunjangForm.butuhCTScan,
        butuh_biopsi: !!editPenunjangForm.butuhBiopsi,
        status_operasi: editPenunjangForm.statusOperasi,
        jenis_tindakan: editPenunjangForm.jenisTindakan,
        prioritas: editPenunjangForm.prioritas,
        catatan_bedah: editPenunjangForm.catatanBedah,
        jadwal_bedah: editPenunjangForm.jadwalBedah ? new Date(editPenunjangForm.jadwalBedah).toISOString() : '',
      }

      let lastErr = null
      let resp = null
      for (const u of urls) {
        try {
          resp = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
          if (resp && resp.ok) break
          const txt = await resp.text().catch(() => '')
          lastErr = `HTTP ${resp.status} ${resp.statusText} - ${txt} @ ${u}`
          resp = null
        } catch (err) {
          lastErr = String(err.message || err)
          resp = null
        }
      }
      if (!resp) throw new Error(lastErr || 'Gagal menghubungi server untuk memperbarui entri penunjang')
      setEditPenunjangVisible(false)
      setPenunjangMessage('Entri penunjang bedah berhasil diperbarui')
      try { await fetchPenunjangHistory(editPenunjangForm.id_pasien ?? selectedPatient?.id) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setEditPenunjangError(String(e.message || e))
    } finally {
      setIsSubmittingEditPenunjang(false)
    }
  }

  const patchHidePenunjang = async (entryId) => {
    if (!entryId) { setPenunjangError('ID entri tidak tersedia'); return }
    try {
      const u = `${API_BASE_URL}/pemeriksaan_penunjang_bedah/${encodeURIComponent(entryId)}/hide`
      const r = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json' } })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      setPenunjangMessage('Entri penunjang bedah berhasil disembunyikan')
      try { await fetchPenunjangHistory(selectedPatient?.id ?? selectedPatient?.idPasien) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setPenunjangError(String(e.message || e))
    }
  }

  const submitEditLokalis = async (e) => {
    e && e.preventDefault && e.preventDefault()
    setEditError('')
    setIsSubmittingEdit(true)
    try {
      const id = editForm.id
      if (!id) throw new Error('ID entri tidak diketahui')
      const u = `${API_BASE_URL}/lokalis_bedah/${encodeURIComponent(id)}`
      const payload = {
        lokasiKelainan: editForm.lokasiKelainan,
        jenisKelainan: editForm.jenisKelainan,
        ukuran: editForm.ukuran,
        warna: editForm.warna,
        nyeriTekan: !!editForm.nyeriTekan,
        konsistensi: editForm.konsistensi,
        mobilitas: editForm.mobilitas,
        tandaRadang: !!editForm.tandaRadang,
        fluktuasi: !!editForm.fluktuasi,
        catatan: editForm.catatan,
      }
      const r = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt}`)
      }
      setEditVisible(false)
      setLokalisMessage('Entri berhasil diperbarui')
      try { await fetchLokalisHistory(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.error(e)
      setEditError(String(e.message || e))
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  useEffect(() => {
    const loadPatient = async () => {
      try {
        if (!antrian || antrian.length === 0) {
          setSelectedPatient(null)
          return
        }
        const first = antrian[0]
        const pid = first.idPasien ?? first.id_pasien ?? first.pasien_id ?? first.id
        if (!pid) { setSelectedPatient(null); return }
        let r = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        if (!r.ok && r.status === 404) {
          try { r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' }) } catch (e) { setSelectedPatient(null); return }
        }
        if (!r.ok) { setSelectedPatient(null); return }
        const d = await r.json()
        const p = Array.isArray(d) ? d[0] : d
        setSelectedPatient(p || null)
      } catch (e) { setSelectedPatient(null) }
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
        try { r = await fetch(`http://localhost:8080/patients/?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' }) } catch (e) { setSelectedPatient(null); return }
      }
      if (!r.ok) { setSelectedPatient(null); return }
      const data = await r.json()
      const p = Array.isArray(data) ? data[0] : data
      setSelectedPatient(p || null)
    } catch (e) { setSelectedPatient(null) }
  }

  const renderTabContent = () => {
    if (selectedTab === 'lokalis') {
      return (
        <>
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
              <h3 style={{ marginTop: 0 }}>Lokalis Bedah</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                setLokalisMessage('')
                setLokalisError('')
                setIsSubmittingLokalis(true)
                try {
                  // determine patient id
                  const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id
                  if (!idPasien) throw new Error('Tidak ada pasien terpilih')

                  // determine dokter id from localStorage or lookup
                  const stored = localStorage.getItem('user')
                  const parsed = stored ? JSON.parse(stored) : {}
                  let idDokter = parsed?.idDokter ?? parsed?.dokterId ?? parsed?.dokter_id ?? parsed?.id
                  if (!idDokter) {
                    try {
                      const res = await fetch(`${API_BASE_URL}/dokter/`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
                      if (res && res.ok) {
                        const list = await res.json()
                        const my = Array.isArray(list) ? list.find(d => (d.id_user == parsed?.id) || (d.idUser == parsed?.id) || (d.user_id == parsed?.id)) : null
                        if (my) idDokter = my.id
                      }
                    } catch (e) { /* ignore */ }
                  }
                  if (!idDokter) throw new Error('Tidak dapat menentukan id dokter yang login')

                  // prepare payload
                  const payload = {
                    id_pasien: Number(idPasien),
                    id_dokter: Number(idDokter),
                    tanggal: new Date().toISOString(),
                    lokasiKelainan: lokalisForm.lokasiKelainan,
                    jenisKelainan: lokalisForm.jenisKelainan,
                    ukuran: lokalisForm.ukuran,
                    warna: lokalisForm.warna,
                    nyeriTekan: !!lokalisForm.nyeriTekan,
                    konsistensi: lokalisForm.konsistensi,
                    mobilitas: lokalisForm.mobilitas,
                    tandaRadang: !!lokalisForm.tandaRadang,
                    fluktuasi: !!lokalisForm.fluktuasi,
                    catatan: lokalisForm.catatan,
                  }

                  // Use dev-server proxy only to avoid CORS in browser.
                  const postUrl = `${API_BASE_URL}/lokalis_bedah`
                  let resp = null
                  try {
                    resp = await fetch(postUrl, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
                  } catch (e) {
                    throw new Error('Gagal menghubungi server proxy. Pastikan Vite dev server dijalankan dan proxy `/api` dikonfigurasi.')
                  }
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => '')
                    throw new Error(`HTTP ${resp.status} ${resp.statusText} - ${txt}`)
                  }
                  setLokalisMessage('Data lokalis bedah berhasil disimpan')
                  setLokalisForm({ lokasiKelainan: '', jenisKelainan: '', ukuran: '', warna: '', nyeriTekan: false, konsistensi: '', mobilitas: '', tandaRadang: false, fluktuasi: false, catatan: '' })
                  try { await fetchLokalisHistory && await fetchLokalisHistory(idPasien) } catch (e) { /* ignore */ }
                } catch (err) {
                  console.error(err)
                  setLokalisError(String(err.message || err))
                } finally {
                  setIsSubmittingLokalis(false)
                }
              }}>
                {lokalisMessage && <div style={{ color: '#059669', marginBottom: 8 }}>{lokalisMessage}</div>}
                {lokalisError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{lokalisError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* tanggal dikirim otomatis, tidak perlu input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Lokasi Kelainan</label>
                    <input type="text" value={lokalisForm.lokasiKelainan} onChange={(e) => setLokalisForm(prev => ({ ...prev, lokasiKelainan: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Jenis Kelainan</label>
                    <input type="text" value={lokalisForm.jenisKelainan} onChange={(e) => setLokalisForm(prev => ({ ...prev, jenisKelainan: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Ukuran</label>
                    <input type="text" value={lokalisForm.ukuran} onChange={(e) => setLokalisForm(prev => ({ ...prev, ukuran: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Warna</label>
                    <input type="text" value={lokalisForm.warna} onChange={(e) => setLokalisForm(prev => ({ ...prev, warna: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="nyeriTekan" type="checkbox" checked={!!lokalisForm.nyeriTekan} onChange={(e) => setLokalisForm(prev => ({ ...prev, nyeriTekan: e.target.checked }))} />
                    <label htmlFor="nyeriTekan">Nyeri Tekan</label>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Konsistensi</label>
                    <input type="text" value={lokalisForm.konsistensi} onChange={(e) => setLokalisForm(prev => ({ ...prev, konsistensi: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Mobilitas</label>
                    <input type="text" value={lokalisForm.mobilitas} onChange={(e) => setLokalisForm(prev => ({ ...prev, mobilitas: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="tandaRadang" type="checkbox" checked={!!lokalisForm.tandaRadang} onChange={(e) => setLokalisForm(prev => ({ ...prev, tandaRadang: e.target.checked }))} />
                    <label htmlFor="tandaRadang">Tanda Radang</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="fluktuasi" type="checkbox" checked={!!lokalisForm.fluktuasi} onChange={(e) => setLokalisForm(prev => ({ ...prev, fluktuasi: e.target.checked }))} />
                    <label htmlFor="fluktuasi">Fluktuasi</label>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 13 }}>Catatan</label>
                    <textarea value={lokalisForm.catatan} onChange={(e) => setLokalisForm(prev => ({ ...prev, catatan: e.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                </div>

                    <div style={{ marginTop: 12 }}>
                      <button type="submit" disabled={isSubmittingLokalis} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>{isSubmittingLokalis ? 'Menyimpan...' : 'Simpan Lokalis'}</button>
                    </div>
              </form>

              
            </div>
          </div>
          {renderLokalisHistory()}
        </>
      )
    }
    if (selectedTab === 'vital') {
      return (
        <>
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
              <h3 style={{ marginTop: 0 }}>Fungsi Organ</h3>
              {fungsiMessage && <div style={{ color: '#059669', marginBottom: 8 }}>{fungsiMessage}</div>}
              {fungsiError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{fungsiError}</div>}
              <form onSubmit={async (e) => {
                e.preventDefault()
                setFungsiMessage('')
                setFungsiError('')
                setIsSubmittingFungsi(true)
                try {
                  // determine patient id
                  const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id
                  if (!idPasien) throw new Error('Tidak ada pasien terpilih')

                  // determine dokter id from localStorage or lookup
                  const stored = localStorage.getItem('user')
                  const parsed = stored ? JSON.parse(stored) : {}
                  let idDokter = parsed?.idDokter ?? parsed?.dokterId ?? parsed?.dokter_id ?? parsed?.id
                  if (!idDokter) {
                    try {
                      const res = await fetch(`${API_BASE_URL}/dokter/`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
                      if (res && res.ok) {
                        const list = await res.json()
                        const my = Array.isArray(list) ? list.find(d => (d.id_user == parsed?.id) || (d.idUser == parsed?.id) || (d.user_id == parsed?.id)) : null
                        if (my) idDokter = my.id
                      }
                    } catch (e) { /* ignore */ }
                  }
                  if (!idDokter) throw new Error('Tidak dapat menentukan id dokter yang login')

                  const payload = {
                    id_pasien: Number(idPasien),
                    id_dokter: Number(idDokter),
                    gangguanBAB: !!fungsiForm.gangguanBAB,
                    gangguanBAK: !!fungsiForm.gangguanBAK,
                    mualMuntah: !!fungsiForm.mualMuntah,
                    demam: !!fungsiForm.demam,
                    perdarahan: !!fungsiForm.perdarahan,
                    penurunanBB: !!fungsiForm.penurunanBB,
                    gangguanGerak: !!fungsiForm.gangguanGerak,
                    catatan: fungsiForm.catatan,
                  }

                  const postUrl = `${API_BASE_URL}/pemeriksaan_fungsi_organ`
                  let resp = null
                  try {
                    resp = await fetch(postUrl, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
                  } catch (e) {
                    throw new Error('Gagal menghubungi server proxy. Pastikan Vite dev server dijalankan dan proxy `/api` dikonfigurasi.')
                  }
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => '')
                    throw new Error(`HTTP ${resp.status} ${resp.statusText} - ${txt}`)
                  }
                  setFungsiMessage('Pemeriksaan fungsi organ berhasil disimpan')
                  setFungsiForm({ gangguanBAB: false, gangguanBAK: false, mualMuntah: false, demam: false, perdarahan: false, penurunanBB: false, gangguanGerak: false, catatan: '' })
                  try {
                    await fetchFungsiHistory(idPasien)
                  } catch (e) { /* ignore */ }
                } catch (err) {
                  console.error(err)
                  setFungsiError(String(err.message || err))
                } finally {
                  setIsSubmittingFungsi(false)
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="gangguanBAB" type="checkbox" checked={!!fungsiForm.gangguanBAB} onChange={(ev) => setFungsiForm(prev => ({ ...prev, gangguanBAB: ev.target.checked }))} />
                    <label htmlFor="gangguanBAB">Gangguan BAB</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="gangguanBAK" type="checkbox" checked={!!fungsiForm.gangguanBAK} onChange={(ev) => setFungsiForm(prev => ({ ...prev, gangguanBAK: ev.target.checked }))} />
                    <label htmlFor="gangguanBAK">Gangguan BAK</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="mualMuntah" type="checkbox" checked={!!fungsiForm.mualMuntah} onChange={(ev) => setFungsiForm(prev => ({ ...prev, mualMuntah: ev.target.checked }))} />
                    <label htmlFor="mualMuntah">Mual / Muntah</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="demam" type="checkbox" checked={!!fungsiForm.demam} onChange={(ev) => setFungsiForm(prev => ({ ...prev, demam: ev.target.checked }))} />
                    <label htmlFor="demam">Demam</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="perdarahan" type="checkbox" checked={!!fungsiForm.perdarahan} onChange={(ev) => setFungsiForm(prev => ({ ...prev, perdarahan: ev.target.checked }))} />
                    <label htmlFor="perdarahan">Perdarahan</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="penurunanBB" type="checkbox" checked={!!fungsiForm.penurunanBB} onChange={(ev) => setFungsiForm(prev => ({ ...prev, penurunanBB: ev.target.checked }))} />
                    <label htmlFor="penurunanBB">Penurunan BB</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="gangguanGerak" type="checkbox" checked={!!fungsiForm.gangguanGerak} onChange={(ev) => setFungsiForm(prev => ({ ...prev, gangguanGerak: ev.target.checked }))} />
                    <label htmlFor="gangguanGerak">Gangguan Gerak</label>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 13 }}>Catatan</label>
                    <textarea value={fungsiForm.catatan} onChange={(ev) => setFungsiForm(prev => ({ ...prev, catatan: ev.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button type="submit" disabled={isSubmittingFungsi} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>{isSubmittingFungsi ? 'Menyimpan...' : 'Simpan Pemeriksaan'}</button>
                </div>
              </form>
            </div>
          </div>
          {renderFungsiHistory()}
        </>
      )
    }

    if (selectedTab === 'penunjang') {
      return (
        <>
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
              <h3 style={{ marginTop: 0 }}>Penunjang Bedah</h3>
              {penunjangMessage && <div style={{ color: '#059669', marginBottom: 8 }}>{penunjangMessage}</div>}
              {penunjangError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{penunjangError}</div>}
              <form onSubmit={async (e) => {
                e.preventDefault()
                setPenunjangMessage('')
                setPenunjangError('')
                setIsSubmittingPenunjang(true)
                try {
                  const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? antrian[0]?.idPasien ?? antrian[0]?.id
                  if (!idPasien) throw new Error('Tidak ada pasien terpilih')

                  const stored = localStorage.getItem('user')
                  const parsed = stored ? JSON.parse(stored) : {}
                  let idDokter = parsed?.idDokter ?? parsed?.dokterId ?? parsed?.dokter_id ?? parsed?.id
                  if (!idDokter) {
                    try {
                      const res = await fetch(`${API_BASE_URL}/dokter/`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
                      if (res && res.ok) {
                        const list = await res.json()
                        const my = Array.isArray(list) ? list.find(d => (d.id_user == parsed?.id) || (d.idUser == parsed?.id) || (d.user_id == parsed?.id)) : null
                        if (my) idDokter = my.id
                      }
                    } catch (e) { /* ignore */ }
                  }
                  if (!idDokter) throw new Error('Tidak dapat menentukan id dokter yang login')

                  const payload = {
                    id_pasien: Number(idPasien),
                    id_dokter: Number(idDokter),
                    butuhUSG: !!penunjangForm.butuhUSG,
                    butuhRontgen: !!penunjangForm.butuhRontgen,
                    butuhCTScan: !!penunjangForm.butuhCTScan,
                    butuhBiopsi: !!penunjangForm.butuhBiopsi,
                    statusOperasi: penunjangForm.statusOperasi,
                    jenisTindakan: penunjangForm.jenisTindakan,
                    prioritas: penunjangForm.prioritas,
                    catatanBedah: penunjangForm.catatanBedah,
                    jadwalBedah: penunjangForm.jadwalBedah ? new Date(penunjangForm.jadwalBedah).toISOString() : '',
                  }

                  const urls = [
                    `${API_BASE_URL}/pemeriksaan_penunjang_bedah`,
                    '/pemeriksaan_penunjang_bedah',
                    'http://localhost:8080/pemeriksaan_penunjang_bedah',
                  ]
                  let resp = null
                  let lastErr = null
                  for (const u of urls) {
                    try {
                      resp = await fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
                      if (resp && resp.ok) break
                      const txt = await resp.text().catch(() => '')
                      lastErr = `HTTP ${resp.status} ${resp.statusText} - ${txt} @ ${u}`
                      resp = null
                    } catch (e) {
                      lastErr = String(e.message || e)
                      resp = null
                    }
                  }
                  if (!resp) {
                    // Show detailed last error when available to help debug (CORS/dev-server)
                    throw new Error(lastErr || 'Gagal menghubungi server penunjang. Pastikan backend berjalan di http://localhost:8080 dan dev server dijalankan (npm run dev)')
                  }
                  setPenunjangMessage('Data penunjang bedah berhasil disimpan')
                  setPenunjangForm({ butuhUSG: false, butuhRontgen: false, butuhCTScan: false, butuhBiopsi: false, statusOperasi: '', jenisTindakan: '', prioritas: '', catatanBedah: '', jadwalBedah: '' })
                  try { await fetchPenunjangHistory(idPasien) } catch (e) { /* ignore */ }
                } catch (err) {
                  console.error(err)
                  setPenunjangError(String(err.message || err))
                } finally {
                  setIsSubmittingPenunjang(false)
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="butuhUSG" type="checkbox" checked={!!penunjangForm.butuhUSG} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, butuhUSG: ev.target.checked }))} />
                    <label htmlFor="butuhUSG">Butuh USG</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="butuhRontgen" type="checkbox" checked={!!penunjangForm.butuhRontgen} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, butuhRontgen: ev.target.checked }))} />
                    <label htmlFor="butuhRontgen">Butuh Rontgen</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="butuhCTScan" type="checkbox" checked={!!penunjangForm.butuhCTScan} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, butuhCTScan: ev.target.checked }))} />
                    <label htmlFor="butuhCTScan">Butuh CT Scan</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input id="butuhBiopsi" type="checkbox" checked={!!penunjangForm.butuhBiopsi} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, butuhBiopsi: ev.target.checked }))} />
                    <label htmlFor="butuhBiopsi">Butuh Biopsi</label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Status Operasi</label>
                    <input type="text" value={penunjangForm.statusOperasi} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, statusOperasi: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Jenis Tindakan</label>
                    <input type="text" value={penunjangForm.jenisTindakan} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, jenisTindakan: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Prioritas</label>
                    <input type="text" value={penunjangForm.prioritas} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, prioritas: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13 }}>Jadwal Bedah</label>
                    <input type="datetime-local" value={penunjangForm.jadwalBedah} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, jadwalBedah: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 13 }}>Catatan Bedah</label>
                    <textarea value={penunjangForm.catatanBedah} onChange={(ev) => setPenunjangForm(prev => ({ ...prev, catatanBedah: ev.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button type="submit" disabled={isSubmittingPenunjang} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>{isSubmittingPenunjang ? 'Menyimpan...' : 'Simpan Penunjang'}</button>
                </div>
              </form>
                </div>
            </div>
            {renderPenunjangHistory()}
        </>
      )
    }

    return null
  }

  return (
    <div className="doctor-dashboard doctor-dashboard--modern">
      <aside className="doctor-sidebar doctor-sidebar--modern">
        <div className="sidebar-brand">RME-link</div>
        <div className="sidebar-status">
          {loadingAntrian ? 'Memuat antrian...' : (antrianError || '')}
        </div>

        <nav className="sidebar-menu sidebar-menu--modern">
          <button
            type="button"
            className="sidebar-item sidebar-item--modern"
            onClick={() => navigate('/dokter')}
          >
            <span className="sidebar-item-left">
              <span className="sidebar-icon">▦</span>
              <span>Dashboard</span>
            </span>
            <span className="sidebar-chevron">›</span>
          </button>

          <div className="sidebar-section">POLIKLINIK</div>

          <button
            type="button"
            className="sidebar-item sidebar-item--modern is-active"
          >
            <span className="sidebar-item-left">
              <span className="sidebar-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                </svg>
              </span>
              <span>Poli Bedah</span>
            </span>
            <span className="sidebar-chevron">›</span>
          </button>
        </nav>
        {confirmVisible && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
            <div style={{ width: 420, background: '#fff', borderRadius: 8, padding: 18, color: '#0f172a' }}>
              <h3 style={{ marginTop: 0 }}>{confirmTitle || 'Peringatan'}</h3>
              <div style={{ padding: '10px 0', color: '#374151' }}>{confirmMessage}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={handleConfirmNo} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={handleConfirmYes} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
              </div>
            </div>
          </div>
        )}

        {editPenunjangVisible && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
            <div style={{ width: 640, background: '#fff', borderRadius: 8, padding: 18, maxHeight: '90vh', overflowY: 'auto', color: '#0f172a' }}>
              <h3 style={{ marginTop: 0 }}>Ubah Pemeriksaan Penunjang Bedah</h3>
              {editPenunjangLoading ? (
                <div style={{ color: '#64748b' }}>Memuat data...</div>
              ) : (
                <form onSubmit={submitEditPenunjang}>
                  {editPenunjangError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{editPenunjangError}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editButuhUSG" type="checkbox" checked={!!editPenunjangForm.butuhUSG} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, butuhUSG: ev.target.checked }))} />
                      <label htmlFor="editButuhUSG">Butuh USG</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editButuhRontgen" type="checkbox" checked={!!editPenunjangForm.butuhRontgen} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, butuhRontgen: ev.target.checked }))} />
                      <label htmlFor="editButuhRontgen">Butuh Rontgen</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editButuhCTScan" type="checkbox" checked={!!editPenunjangForm.butuhCTScan} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, butuhCTScan: ev.target.checked }))} />
                      <label htmlFor="editButuhCTScan">Butuh CT Scan</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editButuhBiopsi" type="checkbox" checked={!!editPenunjangForm.butuhBiopsi} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, butuhBiopsi: ev.target.checked }))} />
                      <label htmlFor="editButuhBiopsi">Butuh Biopsi</label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Status Operasi</label>
                      <input type="text" value={editPenunjangForm.statusOperasi} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, statusOperasi: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Jenis Tindakan</label>
                      <input type="text" value={editPenunjangForm.jenisTindakan} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, jenisTindakan: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Prioritas</label>
                      <input type="text" value={editPenunjangForm.prioritas} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, prioritas: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Jadwal Bedah</label>
                      <input type="datetime-local" value={editPenunjangForm.jadwalBedah} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, jadwalBedah: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 13 }}>Catatan Bedah</label>
                      <textarea value={editPenunjangForm.catatanBedah} onChange={(ev) => setEditPenunjangForm(prev => ({ ...prev, catatanBedah: ev.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={() => setEditPenunjangVisible(false)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                    <button type="submit" disabled={isSubmittingEditPenunjang} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>{isSubmittingEditPenunjang ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {editVisible && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
            <div style={{ width: 640, background: '#fff', borderRadius: 8, padding: 18, maxHeight: '90vh', overflowY: 'auto', color: '#0f172a' }}>
              <h3 style={{ marginTop: 0 }}>Ubah Lokalis Bedah</h3>
              {editLoading ? (
                <div style={{ color: '#64748b' }}>Memuat data...</div>
              ) : (
                <form onSubmit={submitEditLokalis}>
                  {editError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{editError}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Lokasi Kelainan</label>
                      <input value={editForm.lokasiKelainan} onChange={(ev) => setEditForm(prev => ({ ...prev, lokasiKelainan: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Jenis Kelainan</label>
                      <input value={editForm.jenisKelainan} onChange={(ev) => setEditForm(prev => ({ ...prev, jenisKelainan: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Ukuran</label>
                      <input value={editForm.ukuran} onChange={(ev) => setEditForm(prev => ({ ...prev, ukuran: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Warna</label>
                      <input value={editForm.warna} onChange={(ev) => setEditForm(prev => ({ ...prev, warna: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editNyeriTekan" type="checkbox" checked={!!editForm.nyeriTekan} onChange={(ev) => setEditForm(prev => ({ ...prev, nyeriTekan: ev.target.checked }))} />
                      <label htmlFor="editNyeriTekan">Nyeri Tekan</label>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Konsistensi</label>
                      <input value={editForm.konsistensi} onChange={(ev) => setEditForm(prev => ({ ...prev, konsistensi: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13 }}>Mobilitas</label>
                      <input value={editForm.mobilitas} onChange={(ev) => setEditForm(prev => ({ ...prev, mobilitas: ev.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editTandaRadang" type="checkbox" checked={!!editForm.tandaRadang} onChange={(ev) => setEditForm(prev => ({ ...prev, tandaRadang: ev.target.checked }))} />
                      <label htmlFor="editTandaRadang">Tanda Radang</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editFluktuasi" type="checkbox" checked={!!editForm.fluktuasi} onChange={(ev) => setEditForm(prev => ({ ...prev, fluktuasi: ev.target.checked }))} />
                      <label htmlFor="editFluktuasi">Fluktuasi</label>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 13 }}>Catatan</label>
                      <textarea value={editForm.catatan} onChange={(ev) => setEditForm(prev => ({ ...prev, catatan: ev.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={() => setEditVisible(false)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                    <button type="submit" disabled={isSubmittingEdit} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6 }}>{isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {editFungsiVisible && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
            <div style={{ width: 640, background: '#fff', borderRadius: 8, padding: 18, maxHeight: '90vh', overflowY: 'auto', color: '#0f172a' }}>
              <h3 style={{ marginTop: 0 }}>Ubah Pemeriksaan Fungsi Organ</h3>
              {editFungsiLoading ? (
                <div style={{ color: '#64748b' }}>Memuat data...</div>
              ) : (
                <form onSubmit={submitEditFungsi}>
                  {editFungsiError && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{editFungsiError}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editGangguanBAB" type="checkbox" checked={!!editFungsiForm.gangguanBAB} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, gangguanBAB: ev.target.checked }))} />
                      <label htmlFor="editGangguanBAB">Gangguan BAB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editGangguanBAK" type="checkbox" checked={!!editFungsiForm.gangguanBAK} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, gangguanBAK: ev.target.checked }))} />
                      <label htmlFor="editGangguanBAK">Gangguan BAK</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editMualMuntah" type="checkbox" checked={!!editFungsiForm.mualMuntah} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, mualMuntah: ev.target.checked }))} />
                      <label htmlFor="editMualMuntah">Mual / Muntah</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editDemam" type="checkbox" checked={!!editFungsiForm.demam} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, demam: ev.target.checked }))} />
                      <label htmlFor="editDemam">Demam</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editPerdarahan" type="checkbox" checked={!!editFungsiForm.perdarahan} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, perdarahan: ev.target.checked }))} />
                      <label htmlFor="editPerdarahan">Perdarahan</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editPenurunanBB" type="checkbox" checked={!!editFungsiForm.penurunanBB} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, penurunanBB: ev.target.checked }))} />
                      <label htmlFor="editPenurunanBB">Penurunan BB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input id="editGangguanGerak" type="checkbox" checked={!!editFungsiForm.gangguanGerak} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, gangguanGerak: ev.target.checked }))} />
                      <label htmlFor="editGangguanGerak">Gangguan Gerak</label>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 13 }}>Catatan</label>
                      <textarea value={editFungsiForm.catatan} onChange={(ev) => setEditFungsiForm(prev => ({ ...prev, catatan: ev.target.value }))} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', color: '#0f172a' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={() => setEditFungsiVisible(false)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                    <button type="submit" disabled={isSubmittingEditFungsi} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>{isSubmittingEditFungsi ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Selamat Datang di Poli Bedah</h1>
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
            <button type="button" onClick={() => setSelectedTab('lokalis')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'lokalis' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'lokalis' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'lokalis' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Lokalis Bedah</button>
            <button type="button" onClick={() => setSelectedTab('vital')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'vital' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'vital' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'vital' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Fungsi Organ</button>
            <button type="button" onClick={() => setSelectedTab('penunjang')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'penunjang' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'penunjang' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'penunjang' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Penunjang Bedah</button>
            <button type="button" onClick={handleMarkSelesai} disabled={isMarkingSelesai} style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid #e6eef8', background: isMarkingSelesai ? '#94a3b8' : '#10b981', color: '#fff', cursor: 'pointer' }}>{isMarkingSelesai ? 'Memproses...' : 'Selesai'}</button>
          </div>
          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)' }}>
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PoliBedah
