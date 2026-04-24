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
  const [isHidingAnamnesisId, setIsHidingAnamnesisId] = useState(null)
  const [isEditingId, setIsEditingId] = useState(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    text: '',
    riwayat_pengobatan: '',
    riwayat_keluarga: '',
    riwayat_penyakit_dahulu: '',
    riwayat_penyakit_lain: '',
    status_kehamilan: '',
    keluhan_tambahan: ''
  })
  // vital form state
  const [tekananDarah, setTekananDarah] = useState('')
  const [denyutNadi, setDenyutNadi] = useState('')
  const [suhuTubuh, setSuhuTubuh] = useState('')
  const [frekuensiNapas, setFrekuensiNapas] = useState('')
  const [beratBadan, setBeratBadan] = useState('')
  const [tinggiBadan, setTinggiBadan] = useState('')
  const [isSubmittingVital, setIsSubmittingVital] = useState(false)
  const [vitalMessage, setVitalMessage] = useState('')
  const [vitalHistory, setVitalHistory] = useState([])
  const [loadingVitalHistory, setLoadingVitalHistory] = useState(false)
  const [vitalHistoryError, setVitalHistoryError] = useState('')
  const [isEditingVitalId, setIsEditingVitalId] = useState(null)
  const [isSubmittingVitalEdit, setIsSubmittingVitalEdit] = useState(false)
  const [isHidingVitalId, setIsHidingVitalId] = useState(null)
  const [vitalEditMessage, setVitalEditMessage] = useState('')
  const [editVitalForm, setEditVitalForm] = useState({
    tekanan_darah: '',
    denyut_nadi: '',
    suhu_tubuh: '',
    frekuensi_napas: '',
    berat_badan: '',
    tinggi_badan: ''
  })

  // tatalaksana form state
  const [namaObat, setNamaObat] = useState('')
  const [dosis, setDosis] = useState('')
  const [frekuensi, setFrekuensi] = useState('')
  const [durasi, setDurasi] = useState('')
  const [caraPakai, setCaraPakai] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tatalaksanaMessage, setTatalaksanaMessage] = useState('')
  const [isSubmittingTatalaksana, setIsSubmittingTatalaksana] = useState(false)
  const [tatalaksanaHistory, setTatalaksanaHistory] = useState([])
  const [loadingTatalaksanaHistory, setLoadingTatalaksanaHistory] = useState(false)
  const [tatalaksanaHistoryError, setTatalaksanaHistoryError] = useState('')
  const [dokterPoliId, setDokterPoliId] = useState(null)
  // rujukan ulang state (placeholder)
  const [rujukanAsal, setRujukanAsal] = useState('')
  const [rujukanTujuan, setRujukanTujuan] = useState('')
  const [rujukanDiagnosis, setRujukanDiagnosis] = useState('')
  const [rujukanCatatan, setRujukanCatatan] = useState('')
  const [rujukanMessage, setRujukanMessage] = useState('')
  const [isSubmittingRujukan, setIsSubmittingRujukan] = useState(false)
  const [rujukanHistory, setRujukanHistory] = useState([])
  const [loadingRujukanHistory, setLoadingRujukanHistory] = useState(false)
  const [rujukanHistoryError, setRujukanHistoryError] = useState('')
  const [isMarkingSelesai, setIsMarkingSelesai] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  // poli list for dropdown (loaded from /poli)
  const [poliList, setPoliList] = useState([])
  const [loadingPoliList, setLoadingPoliList] = useState(false)
  const [poliListError, setPoliListError] = useState('')
  const [isEditingTatalaksanaId, setIsEditingTatalaksanaId] = useState(null)
  const [isHidingTatalaksanaId, setIsHidingTatalaksanaId] = useState(null)
  const [tatalaksanaEditMessage, setTatalaksanaEditMessage] = useState('')

  const [hoveredPatientId, setHoveredPatientId] = useState(null)
  const lastFetchedPatientId = useRef(null)
  const historyFetchController = useRef(null)
  const hoverTimer = useRef(null)
  // confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const confirmCallback = useRef(null)

  const showConfirm = ({ title = 'Peringatan', message = '', onConfirm = null }) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    confirmCallback.current = onConfirm
    setConfirmVisible(true)
  }

  // format date strings to Asia/Jakarta (UTC+7) for display
  const formatDateToJakarta = (v) => {
    if (!v) return '-'
    try {
      const d = new Date(v)
      if (isNaN(d)) return String(v)
      // convert to Jakarta time by adding UTC+7 offset, then format
      const jakartaMs = d.getTime() + (7 * 60 * 60 * 1000)
      const jd = new Date(jakartaMs)
      const day = String(jd.getUTCDate()).padStart(2, '0')
      const month = String(jd.getUTCMonth() + 1).padStart(2, '0')
      const year = jd.getUTCFullYear()
      const hh = String(jd.getUTCHours()).padStart(2, '0')
      const mm = String(jd.getUTCMinutes()).padStart(2, '0')
      const ss = String(jd.getUTCSeconds()).padStart(2, '0')
      return `${day}/${month}/${year} ${hh}:${mm}:${ss}`
    } catch (e) {
      return String(v)
    }
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
  const fetchAnamnesisHistory = async (id, opts = {}) => {
    try {
      if (!id) {
        setAnamnesisHistory([])
        setAnamnesisHistoryError('')
        lastFetchedPatientId.current = null
        return
      }

      const pidStr = String(id)
      if (!opts.forceRefresh && lastFetchedPatientId.current === pidStr) return

      if (historyFetchController.current) {
        try { historyFetchController.current.abort() } catch (e) {}
      }
      historyFetchController.current = new AbortController()
      const signal = historyFetchController.current.signal

      setLoadingAnamnesisHistory(true)
      setAnamnesisHistoryError('')

      // allow forcing backend-first attempts when navigating from other pages
      // prefer trailing-slash forms first to avoid 301 redirects
      const proxyUrls = [
        `${API_BASE_URL}/anamnesis/?idPasien=${encodeURIComponent(id)}`,
        `${API_BASE_URL}/anamnesis?idPasien=${encodeURIComponent(id)}`
      ]
      const backendUrls = [
        `http://localhost:8080/anamnesis/?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/anamnesis?idPasien=${encodeURIComponent(id)}`
      ]
      const urlsToTry = opts.forceBackend ? [...backendUrls, ...proxyUrls] : [...proxyUrls, ...backendUrls]

      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          console.debug('[fetchAnamnesisHistory] trying', u)
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', signal })
          console.debug('[fetchAnamnesisHistory] response', u, res && res.status)
          if (res && res.ok) break
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          if (e.name === 'AbortError') return
          console.error('[fetchAnamnesisHistory] fetch error', u, e)
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
        console.warn('[fetchAnamnesisHistory] non-json response', { urlAttempted: urlsToTry, status: res.status, text: String(text).slice(0,500) })
        setAnamnesisHistory([])
        setAnamnesisHistoryError(`Unexpected response (not JSON): ${String(text).slice(0,200)}`)
        return
      }

      const data = await res.json()
      setAnamnesisHistory(Array.isArray(data) ? data : [])
      // only mark as fetched after a successful JSON parse
      lastFetchedPatientId.current = pidStr
    } catch (e) {
      console.error('Failed loading anamnesis history', e)
      setAnamnesisHistory([])
      setAnamnesisHistoryError(String(e.message || e))
    } finally {
      setLoadingAnamnesisHistory(false)
    }
  }

  // fetch tatalaksana history for a given patient id
  const fetchTatalaksanaHistory = async (id, opts = {}) => {
    try {
      if (!id) {
        setTatalaksanaHistory([])
        setTatalaksanaHistoryError('')
        return
      }
      const pidStr = String(id)
      setLoadingTatalaksanaHistory(true)
      setTatalaksanaHistoryError('')

      const proxyUrls = [
        `${API_BASE_URL}/tatalaksana/?idPasien=${encodeURIComponent(id)}`,
        `${API_BASE_URL}/tatalaksana?idPasien=${encodeURIComponent(id)}`
      ]
      const backendUrls = [
        `http://localhost:8080/tatalaksana/?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/tatalaksana?idPasien=${encodeURIComponent(id)}`
      ]
      const urlsToTry = opts.forceBackend ? [...backendUrls, ...proxyUrls] : [...proxyUrls, ...backendUrls]

      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) break
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          lastErr = e
        }
      }

      if (!res || !res.ok) {
        setTatalaksanaHistory([])
        setTatalaksanaHistoryError(`Gagal memuat riwayat tatalaksana: ${String(lastErr)}`)
        return
      }
      const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '')
        setTatalaksanaHistory([])
        setTatalaksanaHistoryError(`Unexpected response (not JSON): ${String(text).slice(0,200)}`)
        return
      }
      const data = await res.json()
      setTatalaksanaHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed loading tatalaksana history', e)
      setTatalaksanaHistory([])
      setTatalaksanaHistoryError(String(e.message || e))
    } finally {
      setLoadingTatalaksanaHistory(false)
    }
  }

  // load anamnesis history when selected patient or hovered patient changes
  useEffect(() => {
    const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
    fetchAnamnesisHistory(pid)
    // also fetch vital history when the Vital tab is active
    if (selectedTab === 'vital') {
      try { fetchVitalHistory(dokterId, pid) } catch (e) { /* ignore */ }
    }
    if (selectedTab === 'tatalaksana') {
      try { fetchTatalaksanaHistory(pid) } catch (e) { /* ignore */ }
    }
    if (selectedTab === 'rujukan') {
      try { fetchRujukanHistory(pid) } catch (e) { /* ignore */ }
    }

    return () => {
      if (historyFetchController.current) {
        try { historyFetchController.current.abort() } catch (e) {}
        historyFetchController.current = null
      }
    }
  }, [hoveredPatientId, selectedPatient, antrian, selectedTab])

  // hide (soft-delete) an anamnesis entry by calling backend hide endpoint
  const handleHideAnamnesis = async (row) => {
    const aid = row?.id_anamnesis ?? row?.idAnamnesis ?? row?.id ?? null
    if (!aid) {
      console.warn('No anamnesis id available for hide action', row)
      return
    }
    setIsHidingAnamnesisId(aid)
    try {
      const proxyUrl = `${API_BASE_URL}/anamnesis/${aid}/hide`
      const backendUrl = `http://localhost:8080/anamnesis/${aid}/hide`
      const urls = [proxyUrl, backendUrl]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          // PATCH without body; include headers. Calling proxy first avoids CORS.
          const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            success = true
            break
          }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          // fetch can throw on network/CORS errors; keep trying fallback
          console.warn('hide fetch error, trying next', u, e)
          lastErr = e
        }
      }

      if (!success) {
        console.error('Failed to hide anamnesis (all attempts)', lastErr)
        setAnamnesisMessage('Gagal menghapus riwayat anamnesis')
        return
      }

      const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id)
                            await fetchAnamnesisHistory(pid, { forceRefresh: true })
      setAnamnesisMessage('Riwayat berhasil dihapus')
    } catch (e) {
      console.error('Error hiding anamnesis', e)
      setAnamnesisMessage('Gagal menghapus riwayat anamnesis')
    } finally {
      setIsHidingAnamnesisId(null)
    }
  }

  // open edit modal and load anamnesis by id
  const handleOpenEdit = async (row) => {
    const aid = row?.id_anamnesis ?? row?.idAnamnesis ?? row?.id ?? null
    if (!aid) return
    setIsEditingId(aid)
    // try proxy first, then backend
    const proxyUrl = `${API_BASE_URL}/anamnesis/${aid}`
    const backendUrl = `http://localhost:8080/anamnesis/${aid}`
    const urls = [proxyUrl, backendUrl]
    let lastErr = null
    try {
      for (const u of urls) {
        try {
          const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            const data = await res.json()
            setEditForm({
              text: data.text ?? '',
              riwayat_pengobatan: data.riwayat_pengobatan ?? data.riwayatPengobatan ?? '',
              riwayat_keluarga: data.riwayat_keluarga ?? data.riwayatKeluarga ?? '',
              riwayat_penyakit_dahulu: data.riwayat_penyakit_dahulu ?? data.riwayatPenyakitDahulu ?? '',
              riwayat_penyakit_lain: data.riwayat_penyakit_lain ?? data.riwayatPenyakitLain ?? '',
              status_kehamilan: data.status_kehamilan ?? data.statusKehamilan ?? '',
              keluhan_tambahan: data.keluhan_tambahan ?? data.keluhanTambahan ?? ''
            })
            return
          }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          lastErr = e
        }
      }
      console.error('Failed loading anamnesis for edit', lastErr)
      setAnamnesisMessage('Gagal memuat data untuk ubah')
      setIsEditingId(null)
    } catch (e) {
      console.error('Error opening edit', e)
      setAnamnesisMessage('Gagal memuat data untuk ubah')
      setIsEditingId(null)
    }
  }

  // open edit modal for vital
  const handleOpenVitalEdit = async (row) => {
    const vid = row?.id_pemeriksaan_vital ?? row?.id ?? row?.idPemeriksaanVital ?? row?.id_pv ?? null
    if (!vid) return
    setIsEditingVitalId(vid)
    setVitalEditMessage('')
    const proxyUrl = `${API_BASE_URL}/pemeriksaan_vital/${vid}`
    const backendUrl = `http://localhost:8080/pemeriksaan_vital/${vid}`
    const urls = [proxyUrl, backendUrl]
    let lastErr = null
    try {
      for (const u of urls) {
        try {
          const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            const data = await res.json()
            setEditVitalForm({
              tekanan_darah: data.tekanan_darah ?? data.tekananDarah ?? '',
              denyut_nadi: data.denyut_nadi ?? data.denyutNadi ?? '',
              suhu_tubuh: data.suhu_tubuh ?? data.suhuTubuh ?? '',
              frekuensi_napas: data.frekuensi_napas ?? data.frekuensiNapas ?? '',
              berat_badan: data.berat_badan ?? data.beratBadan ?? '',
              tinggi_badan: data.tinggi_badan ?? data.tinggiBadan ?? ''
            })
            return
          }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      console.error('Failed loading vital for edit', lastErr)
      setVitalEditMessage('Gagal memuat data untuk ubah')
      setIsEditingVitalId(null)
    } catch (e) {
      console.error('Error opening vital edit', e)
      setVitalEditMessage('Gagal memuat data untuk ubah')
      setIsEditingVitalId(null)
    }
  }

  const handleSubmitVitalEdit = async () => {
    const vid = isEditingVitalId
    if (!vid) return
    setIsSubmittingVitalEdit(true)
    setVitalEditMessage('')
    try {
      const payload = {
        tekanan_darah: editVitalForm.tekanan_darah,
        denyut_nadi: editVitalForm.denyut_nadi ? Number(editVitalForm.denyut_nadi) : undefined,
        suhu_tubuh: editVitalForm.suhu_tubuh ? Number(editVitalForm.suhu_tubuh) : undefined,
        frekuensi_napas: editVitalForm.frekuensi_napas ? Number(editVitalForm.frekuensi_napas) : undefined,
        berat_badan: editVitalForm.berat_badan ? Number(editVitalForm.berat_badan) : undefined,
        tinggi_badan: editVitalForm.tinggi_badan ? Number(editVitalForm.tinggi_badan) : undefined
      }
      // remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const proxyUrl = `${API_BASE_URL}/pemeriksaan_vital/${vid}`
      const backendUrl = `http://localhost:8080/pemeriksaan_vital/${vid}`
      const urls = [proxyUrl, backendUrl]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
          if (res && res.ok) { success = true; break }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!success) {
        console.error('Failed updating vital', lastErr)
        setVitalEditMessage('Gagal memperbarui pemeriksaan vital')
        return
      }
      // refresh history
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      await fetchVitalHistory(dokterId, pid)
      setVitalEditMessage('Pemeriksaan vital berhasil diperbarui')
      setIsEditingVitalId(null)
    } catch (e) {
      console.error('Error submitting vital edit', e)
      setVitalEditMessage('Gagal memperbarui pemeriksaan vital')
    } finally {
      setIsSubmittingVitalEdit(false)
    }
  }

  const handleHideVital = async (row) => {
    const vid = row?.id_pemeriksaan_vital ?? row?.id ?? row?.idPemeriksaanVital ?? null
    if (!vid) return
    setIsHidingVitalId(vid)
    try {
      const proxyUrl = `${API_BASE_URL}/pemeriksaan_vital/${vid}/hide`
      const backendUrl = `http://localhost:8080/pemeriksaan_vital/${vid}/hide`
      const urls = [proxyUrl, backendUrl]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
          if (res && res.ok) { success = true; break }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!success) {
        console.error('Failed to hide vital', lastErr)
        setVitalEditMessage('Gagal menghapus riwayat pemeriksaan vital')
        return
      }
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      await fetchVitalHistory(dokterId, pid)
    } catch (e) {
      console.error('Error hiding vital', e)
      setVitalEditMessage('Gagal menghapus riwayat pemeriksaan vital')
    } finally {
      setIsHidingVitalId(null)
    }
  }

  const handleSubmitEdit = async () => {
    const aid = isEditingId
    if (!aid) return
    setIsSubmittingEdit(true)
    try {
      const payload = {
        text: editForm.text,
        riwayat_pengobatan: editForm.riwayat_pengobatan,
        riwayat_keluarga: editForm.riwayat_keluarga,
        riwayat_penyakit_dahulu: editForm.riwayat_penyakit_dahulu,
        riwayat_penyakit_lain: editForm.riwayat_penyakit_lain,
        status_kehamilan: editForm.status_kehamilan,
        keluhan_tambahan: editForm.keluhan_tambahan
      }
      const proxyUrl = `${API_BASE_URL}/anamnesis/${aid}`
      const backendUrl = `http://localhost:8080/anamnesis/${aid}`
      const urls = [proxyUrl, backendUrl]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
          if (res && res.ok) { success = true; break }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!success) {
        console.error('Failed updating anamnesis', lastErr)
        setAnamnesisMessage('Gagal memperbarui anamnesis')
        return
      }
      // refresh history and close modal
      const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id)
      await fetchAnamnesisHistory(pid, { forceRefresh: true })
      setAnamnesisMessage('Riwayat berhasil diperbarui')
      setIsEditingId(null)
    } catch (e) {
      console.error('Error submitting edit', e)
      setAnamnesisMessage('Gagal memperbarui anamnesis')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // submit pemeriksaan vital
  const handleSubmitVital = async () => {
    setVitalMessage('')
    setIsSubmittingVital(true)
    try {
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) throw new Error('Tidak ada pasien terpilih (hover atau pilih pasien).')
      const did = dokterId ? Number(dokterId) : undefined
      const payload = {
        idPasien: Number(pid),
        idDokter: did,
        tekanan_darah: tekananDarah || undefined,
        denyut_nadi: denyutNadi ? Number(denyutNadi) : undefined,
        suhu_tubuh: suhuTubuh ? Number(suhuTubuh) : undefined,
        frekuensi_napas: frekuensiNapas ? Number(frekuensiNapas) : undefined,
        berat_badan: beratBadan ? Number(beratBadan) : undefined,
        tinggi_badan: tinggiBadan ? Number(tinggiBadan) : undefined
      }
      if (!payload.idDokter) delete payload.idDokter

      // Only send POST via dev proxy to avoid browser CORS (do not fallback to backend host)
      const proxyUrls = [
        `${API_BASE_URL}/pemeriksaan_vital/`,
        `${API_BASE_URL}/pemeriksaan_vital`
      ]
      let res = null
      try {
        res = await fetch(proxyUrls[0], { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
        if (!res.ok) {
          // try non-trailing as a fallback on proxy only
          res = await fetch(proxyUrls[1], { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
        }
      } catch (e) {
        console.error('Failed submitting vital via proxy', e)
        setVitalMessage('Gagal menyimpan pemeriksaan vital')
        return
      }
      if (!res || !res.ok) {
        const text = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''))
        console.error('Failed submitting vital (proxy)', res && res.status, text)
        setVitalMessage('Gagal menyimpan pemeriksaan vital')
        return
      }
      setVitalMessage('Pemeriksaan vital tersimpan')
      // clear form
      setTekananDarah('')
      setDenyutNadi('')
      setSuhuTubuh('')
      setFrekuensiNapas('')
      setBeratBadan('')
      setTinggiBadan('')
      // refresh vital history for this dokter
      try { await fetchVitalHistory(dokterId, pid) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error saving vital', e)
      setVitalMessage('Gagal menyimpan pemeriksaan vital: ' + (e.message || e))
    } finally {
      setIsSubmittingVital(false)
    }
  }

  // submit tatalaksana (create)
  const handleSubmitTatalaksana = async () => {
    setTatalaksanaMessage('')
    setIsSubmittingTatalaksana(true)
    try {
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) throw new Error('Tidak ada pasien terpilih (hover atau pilih pasien).')
      const did = dokterId ? Number(dokterId) : undefined
      const payload = {
        idPasien: Number(pid),
        idDokter: did,
        nama_obat: namaObat,
        dosis: dosis,
        frekuensi: frekuensi,
        durasi: durasi,
        cara_pakai: caraPakai,
        catatan: catatan
      }
      if (!payload.idDokter) delete payload.idDokter

      // decide create vs update
      if (isEditingTatalaksanaId) {
        // update (PATCH)
        const tid = isEditingTatalaksanaId
        const proxyUrl = `${API_BASE_URL}/tatalaksana/${encodeURIComponent(tid)}`
        const backendUrl = `http://localhost:8080/tatalaksana/${encodeURIComponent(tid)}`
        const urls = [proxyUrl, backendUrl]
        let lastErr = null
        let success = false
        for (const u of urls) {
          try {
            const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
            if (res && res.ok) { success = true; break }
            lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
          } catch (e) { lastErr = e }
        }
        if (!success) {
          console.error('Failed updating tatalaksana', lastErr)
          setTatalaksanaMessage('Gagal memperbarui tatalaksana')
        } else {
          setTatalaksanaMessage('Tatalaksana berhasil diperbarui')
          setIsEditingTatalaksanaId(null)
          // clear form
          setNamaObat('')
          setDosis('')
          setFrekuensi('')
          setDurasi('')
          setCaraPakai('')
          setCatatan('')
          try { await fetchTatalaksanaHistory(pid, { forceRefresh: true }) } catch (e) { /* ignore */ }
        }
      } else {
        const proxyUrls = [
          `${API_BASE_URL}/tatalaksana/`,
          `${API_BASE_URL}/tatalaksana`
        ]
        let res = null
        try {
          res = await fetch(proxyUrls[0], { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
          if (!res.ok) {
            res = await fetch(proxyUrls[1], { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
          }
        } catch (e) {
          console.error('Failed submitting tatalaksana via proxy', e)
          setTatalaksanaMessage('Gagal menyimpan tatalaksana')
          return
        }
        if (!res || !res.ok) {
          const text = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''))
          console.error('Failed submitting tatalaksana (proxy)', res && res.status, text)
          setTatalaksanaMessage('Gagal menyimpan tatalaksana')
          return
        }
        setTatalaksanaMessage('Tatalaksana tersimpan')
        // clear form
        setNamaObat('')
        setDosis('')
        setFrekuensi('')
        setDurasi('')
        setCaraPakai('')
        setCatatan('')
        // refresh history for this patient
        try { await fetchTatalaksanaHistory(pid, { forceRefresh: true }) } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.error('Error saving tatalaksana', e)
      setTatalaksanaMessage('Gagal menyimpan tatalaksana: ' + (e.message || e))
    } finally {
      setIsSubmittingTatalaksana(false)
    }
  }

  const handleOpenTatalaksanaEdit = async (row) => {
    const tid = row?.id_tatalaksana ?? row?.id ?? row?.idTatalaksana ?? null
    if (!tid) return
    setIsEditingTatalaksanaId(tid)
    setTatalaksanaEditMessage('')
    // fetch latest data from backend (try proxy then backend)
    const proxyUrl = `${API_BASE_URL}/tatalaksana/${encodeURIComponent(tid)}`
    const backendUrl = `http://localhost:8080/tatalaksana/${encodeURIComponent(tid)}`
    const urls = [proxyUrl, backendUrl]
    let lastErr = null
    try {
      for (const u of urls) {
        try {
          const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            const data = await res.json()
            const t = Array.isArray(data) ? data[0] : data
            setNamaObat(t?.nama_obat ?? t?.namaObat ?? '')
            setDosis(t?.dosis ?? '')
            setFrekuensi(t?.frekuensi ?? '')
            setDurasi(t?.durasi ?? '')
            setCaraPakai(t?.cara_pakai ?? t?.caraPakai ?? '')
            setCatatan(t?.catatan ?? '')
            return
          }
          lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
        } catch (e) {
          lastErr = e
        }
      }
      console.error('Failed loading tatalaksana for edit', lastErr)
      setTatalaksanaEditMessage('Gagal memuat data untuk ubah')
      // fallback to using provided row values if available
      setNamaObat(row.nama_obat ?? row.namaObat ?? '')
      setDosis(row.dosis ?? '')
      setFrekuensi(row.frekuensi ?? '')
      setDurasi(row.durasi ?? '')
      setCaraPakai(row.cara_pakai ?? row.caraPakai ?? '')
      setCatatan(row.catatan ?? '')
    } catch (e) {
      console.error('Error opening tatalaksana edit', e)
      setTatalaksanaEditMessage('Gagal memuat data untuk ubah')
      setNamaObat(row.nama_obat ?? row.namaObat ?? '')
      setDosis(row.dosis ?? '')
      setFrekuensi(row.frekuensi ?? '')
      setDurasi(row.durasi ?? '')
      setCaraPakai(row.cara_pakai ?? row.caraPakai ?? '')
      setCatatan(row.catatan ?? '')
    }
  }

  const handleHideTatalaksana = async (row) => {
    const tid = row?.id_tatalaksana ?? row?.id ?? row?.idTatalaksana ?? null
    if (!tid) return
    setIsHidingTatalaksanaId(tid)
    try {
      const proxyUrl = `${API_BASE_URL}/tatalaksana/${encodeURIComponent(tid)}/hide`
      const backendUrl = `http://localhost:8080/tatalaksana/${encodeURIComponent(tid)}/hide`
      const urls = [proxyUrl, backendUrl]
      let lastErr = null
      let success = false
      for (const u of urls) {
        try {
          const res = await fetch(u, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
          if (res && res.ok) { success = true; break }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!success) {
        console.error('Failed to hide tatalaksana', lastErr)
        setTatalaksanaMessage('Gagal menghapus riwayat tatalaksana')
        return
      }
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      await fetchTatalaksanaHistory(pid, { forceRefresh: true })
    } catch (e) {
      console.error('Error hiding tatalaksana', e)
      setTatalaksanaMessage('Gagal menghapus riwayat tatalaksana')
    } finally {
      setIsHidingTatalaksanaId(null)
    }
  }

  const fetchRujukanHistory = async (id, opts = {}) => {
    try {
      if (!id) {
        setRujukanHistory([])
        setRujukanHistoryError('')
        return
      }
      setLoadingRujukanHistory(true)
      setRujukanHistoryError('')
      const proxyUrls = [
        `${API_BASE_URL}/rujuk_ulang/?idPasien=${encodeURIComponent(id)}`,
        `${API_BASE_URL}/rujuk_ulang?idPasien=${encodeURIComponent(id)}`
      ]
      const backendUrls = [
        `http://localhost:8080/rujuk_ulang/?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/rujuk_ulang?idPasien=${encodeURIComponent(id)}`
      ]
      const urlsToTry = opts.forceBackend ? [...backendUrls, ...proxyUrls] : [...proxyUrls, ...backendUrls]
      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) break
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!res || !res.ok) {
        setRujukanHistory([])
        setRujukanHistoryError(`Gagal memuat riwayat rujukan: ${String(lastErr)}`)
        return
      }
      const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '')
        setRujukanHistory([])
        setRujukanHistoryError(`Unexpected response (not JSON): ${String(text).slice(0,200)}`)
        return
      }
      const data = await res.json()
      setRujukanHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed loading rujukan history', e)
      setRujukanHistory([])
      setRujukanHistoryError(String(e.message || e))
    } finally {
      setLoadingRujukanHistory(false)
    }
  }

  // fetch poli list for dropdown (exclude id 1 in rendering)
  const fetchPoliList = async () => {
    try {
      setLoadingPoliList(true)
      setPoliListError('')
      const proxyUrls = [`${API_BASE_URL}/poli/`, `${API_BASE_URL}/poli`]
      const backendUrls = [`http://localhost:8080/poli/`, `http://localhost:8080/poli`]
      const urlsToTry = [...proxyUrls, ...backendUrls]
      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) break
          lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      if (!res || !res.ok) {
        setPoliList([])
        setPoliListError(`Gagal memuat daftar poli: ${String(lastErr)}`)
        return
      }
      const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '')
        setPoliList([])
        setPoliListError(`Unexpected response (not JSON): ${String(text).slice(0,200)}`)
        return
      }
      const data = await res.json()
      setPoliList(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed loading poli list', e)
      setPoliList([])
      setPoliListError(String(e.message || e))
    } finally {
      setLoadingPoliList(false)
    }
  }

  useEffect(() => {
    try {
      fetchPoliList()
    } catch (e) { /* ignore */ }
  }, [])

  const handleSubmitRujukan = async () => {
    setRujukanMessage('')
    setIsSubmittingRujukan(true)
    try {
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) throw new Error('Tidak ada pasien terpilih (hover atau pilih pasien).')
      const payload = {
        idPasien: Number(pid),
        poliAsal: 1,
        idDokter: dokterId ? Number(dokterId) : undefined,
        poliTujuan: rujukanTujuan ? Number(rujukanTujuan) : undefined,
        diagnosis_sementara: rujukanDiagnosis,
        catatan: rujukanCatatan
      }
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      // try proxy first (trailing slash), then proxy non-trailing, then backend as fallback
      const proxyUrls = [
        `${API_BASE_URL}/rujuk_ulang/`,
        `${API_BASE_URL}/rujuk_ulang`
      ]
      const backendUrls = [
        `http://localhost:8080/rujuk_ulang/`,
        `http://localhost:8080/rujuk_ulang`
      ]
      const urlsToTry = [...proxyUrls, ...backendUrls]

      let res = null
      let lastErr = null
      for (const u of urlsToTry) {
        try {
          res = await fetch(u, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
          if (res && res.ok) break
          lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
        } catch (e) {
          lastErr = e
        }
      }
      if (!res || !res.ok) {
        console.error('Failed submitting rujukan', lastErr)
        setRujukanMessage('Gagal menyimpan rujukan: ' + String(lastErr))
        return
      }
      setRujukanMessage('Rujukan tersimpan')
      // clear form
      setRujukanAsal('')
      setRujukanTujuan('')
      setRujukanDiagnosis('')
      setRujukanCatatan('')
      // refresh history
      try { await fetchRujukanHistory(pid, { forceRefresh: true }) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error saving rujukan', e)
      setRujukanMessage('Gagal menyimpan rujukan: ' + (e.message || e))
    } finally {
      setIsSubmittingRujukan(false)
    }
  }

  const handleMarkSelesai = async () => {
    try {
      const pid = hoveredPatientId ?? (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) {
        alert('Pilih pasien terlebih dahulu untuk menandai selesai')
        return
      }
      // optimistic: remove from antrian immediately
      setMarkingId(pid)
      setIsMarkingSelesai(true)
      setAntrian(prev => prev.filter(it => String(it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id) !== String(pid)))

      // Try delete via proxy first, then backend fallback (support trailing/non-trailing)
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
          // do not treat 404 from dev server proxy as success; keep trying fallbacks
          lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
        } catch (e) {
          lastErr = e
        }
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

  const handlePrintTatalaksana = () => {
    try {
      const patientName = selectedPatient?.namaPasien || selectedPatient?.full_name || (antrian[0]?.namaPasien ?? '')
      const title = `Riwayat Tatalaksana - ${patientName || ''}`
      const styles = `
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
        h2{margin-bottom:8px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f3f4f6}
      `
      const rows = (tatalaksanaHistory || []).map(t => {
        const date = formatDateToJakarta(t.date_make ?? t.dateMake)
        const nama = t.nama_obat ?? t.namaObat ?? '-'
        const dosis = t.dosis ?? '-'
        const frek = t.frekuensi ?? '-'
        const dur = t.durasi ?? '-'
        const cara = t.cara_pakai ?? t.caraPakai ?? '-'
        const cat = t.catatan ?? '-'
        return `<tr><td>${date}</td><td>${escapeHtml(nama)}</td><td>${escapeHtml(dosis)}</td><td>${escapeHtml(frek)}</td><td>${escapeHtml(dur)}</td><td>${escapeHtml(cara)}</td><td>${escapeHtml(cat)}</td></tr>`
      }).join('')

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${styles}</style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr><th>Tanggal</th><th>Nama Obat</th><th>Dosis</th><th>Frekuensi</th><th>Durasi</th><th>Cara Pakai</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();setTimeout(()=>window.close(),500);};</script></body></html>`

      const w = window.open('', '_blank')
      if (!w) {
        alert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.')
        return
      }
      w.document.open()
      w.document.write(html)
      w.document.close()
    } catch (e) {
      console.error('Error printing tatalaksana', e)
      alert('Gagal memproses cetak: ' + (e && e.message ? e.message : String(e)))
    }
  }

  const handlePrintRujukan = () => {
    try {
      const patientName = selectedPatient?.namaPasien || selectedPatient?.full_name || (antrian[0]?.namaPasien ?? '')
      const title = `Rujukan Ulang - ${patientName || ''}`
      const styles = `
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
        h2{margin-bottom:8px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f3f4f6}
      `
      const rows = (rujukanHistory || []).map(r => {
        const date = formatDateToJakarta(r.date_make ?? r.dateMake)
        const namaPasien = r.nama_pasien ?? r.namaPasien ?? '-'
        const poliAsal = r.nama_poli_asal ?? r.namaPoliAsal ?? '-'
        const poliTujuan = r.nama_poli_tujuan ?? r.namaPoliTujuan ?? r.nama_poli_tujuan ?? '-'
        const diagnosa = r.diagnosis_sementara ?? r.diagnosisSementara ?? '-'
        const cat = r.catatan ?? '-'
        const namaDokter = r.nama_dokter ?? r.namaDokter ?? (user.full_name || '-')
        return `<tr><td>${date}</td><td>${escapeHtml(namaPasien)}</td><td>${escapeHtml(poliAsal)}</td><td>${escapeHtml(poliTujuan)}</td><td>${escapeHtml(diagnosa)}</td><td>${escapeHtml(cat)}</td><td>${escapeHtml(namaDokter)}</td></tr>`
      }).join('')

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${styles}</style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr><th>Tanggal</th><th>Nama Pasien</th><th>Poli Asal</th><th>Poli Tujuan</th><th>Diagnosis Sementara</th><th>Catatan</th><th>Nama Dokter</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();setTimeout(()=>window.close(),500);};</script></body></html>`

      const w = window.open('', '_blank')
      if (!w) {
        alert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.')
        return
      }
      w.document.open()
      w.document.write(html)
      w.document.close()
    } catch (e) {
      console.error('Error printing rujukan', e)
      alert('Gagal memproses cetak rujukan: ' + (e && e.message ? e.message : String(e)))
    }
  }

  // small helper to escape text for HTML
  const escapeHtml = (s) => {
    if (s === null || s === undefined) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  const fetchVitalHistory = async (did, pid) => {
    try {
      setLoadingVitalHistory(true)
      setVitalHistoryError('')
      setVitalHistory([])
      if (!did) {
        // if dokter id not provided, we may still fetch by pasien id
        if (!pid) {
          setVitalHistory([])
          return
        }
      }
      // build query based on available identifier: prefer pasien id when given
      let urlsToTry = []
      if (pid) {
        const proxyUrls = [
          `${API_BASE_URL}/pemeriksaan_vital/?idPasien=${encodeURIComponent(pid)}`,
          `${API_BASE_URL}/pemeriksaan_vital?idPasien=${encodeURIComponent(pid)}`
        ]
        const backendUrls = [
          `http://localhost:8080/pemeriksaan_vital/?idPasien=${encodeURIComponent(pid)}`,
          `http://localhost:8080/pemeriksaan_vital?idPasien=${encodeURIComponent(pid)}`
        ]
        urlsToTry = [...proxyUrls, ...backendUrls]
      } else {
        const proxyUrls = [
          `${API_BASE_URL}/pemeriksaan_vital/?idDokter=${encodeURIComponent(did)}`,
          `${API_BASE_URL}/pemeriksaan_vital?idDokter=${encodeURIComponent(did)}`
        ]
        const backendUrls = [
          `http://localhost:8080/pemeriksaan_vital/?idDokter=${encodeURIComponent(did)}`,
          `http://localhost:8080/pemeriksaan_vital?idDokter=${encodeURIComponent(did)}`
        ]
        urlsToTry = [...proxyUrls, ...backendUrls]
      }

      let lastErr = null
      let res = null
      for (const u of urlsToTry) {
        try {
          console.debug('[fetchVitalHistory] trying', u)
          res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          console.debug('[fetchVitalHistory] response', u, res && res.status)
          if (res && res.ok) break
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) {
          console.warn('[fetchVitalHistory] fetch error', u, e)
          lastErr = e
        }
      }

      if (!res || !res.ok) {
        setVitalHistory([])
        setVitalHistoryError(`Gagal memuat riwayat pemeriksaan vital: ${String(lastErr)}`)
        return
      }

      const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '')
        console.warn('[fetchVitalHistory] non-json response', { status: res.status, text: String(text).slice(0,500) })
        setVitalHistory([])
        setVitalHistoryError('Unexpected response (not JSON)')
        return
      }

      const data = await res.json()
      setVitalHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed loading vital history', e)
      setVitalHistory([])
      setVitalHistoryError(String(e.message || e))
    } finally {
      setLoadingVitalHistory(false)
    }
  }
 

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

  // when dokterId is known, fetch dokter details to determine poli id and prefill rujukanAsal
  useEffect(() => {
    if (!dokterId) return
    let cancelled = false
    const load = async () => {
      try {
        const proxyUrl = `${API_BASE_URL}/dokter/${encodeURIComponent(dokterId)}`
        const backendUrl = `http://localhost:8080/dokter/${encodeURIComponent(dokterId)}`
        const urls = [proxyUrl, backendUrl]
        let lastErr = null
        let res = null
        for (const u of urls) {
          try {
            res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
            if (res && res.ok) break
            lastErr = `HTTP ${res && res.status} ${res && res.statusText} @ ${u}`
          } catch (e) { lastErr = e }
        }
        if (!res || !res.ok) {
          console.warn('Failed fetching dokter detail for poli id', lastErr)
          return
        }
        const data = await res.json()
        const dok = Array.isArray(data) ? data[0] : data
        if (cancelled) return
        let poliId = null
        // handle various shapes: poli may be number or an object containing id
        if (dok) {
          const rawP = dok.poli ?? dok.poli_id ?? dok.id_poli ?? dok.idPoli ?? dok.poliId ?? dok.idPoliklinik ?? dok.id_poliklinik ?? null
          if (rawP && typeof rawP === 'object') {
            poliId = rawP.id ?? rawP.id_poli ?? rawP.idPoli ?? rawP.value ?? null
          } else {
            poliId = rawP
          }
        }
        if (poliId !== null && poliId !== undefined) {
          const asNumber = Number(poliId)
          if (!isNaN(asNumber)) {
            setDokterPoliId(asNumber)
            setRujukanAsal(prev => (prev ? prev : String(asNumber)))
          } else {
            // fallback to string if cannot coerce
            setDokterPoliId(poliId)
            setRujukanAsal(prev => (prev ? prev : String(poliId)))
          }
        }
      } catch (e) {
        console.error('Error loading dokter detail', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [dokterId])

  // load vital history when dokterId is known
  useEffect(() => {
    // only fetch when the user is viewing the Vital tab to avoid unnecessary requests
    if (!dokterId) return
    if (selectedTab !== 'vital') return
    fetchVitalHistory(dokterId)
  }, [dokterId, selectedTab])

  const location = useLocation()

  useEffect(() => {
    // if navigated here with state.idPasien, select that patient (even if antrian not yet loaded)
    const idFromNav = location?.state?.idPasien
    if (idFromNav) {
      const found = (antrian || []).find(a => String(a.idPasien ?? a.id_pasien ?? a.pasien_id ?? a.id) === String(idFromNav))
      if (found) {
        handleSelectPatient(found)
      } else {
        handleSelectPatient({ idPasien: idFromNav })
      }
      // also mark as hovered so anamnesis/history shows immediately
        try {
          setHoveredPatientId(idFromNav)
          setSelectedTab('anamnesis')
          // trigger history fetch immediately for the navigated patient id
          // prefer proxy-first to avoid CORS; still force refresh to update immediately
          fetchAnamnesisHistory(idFromNav, { forceRefresh: true })
      } catch (e) { /* ignore */ }
    }
  }, [location, antrian])


  const patientCard = (
    <div style={{ width: 360, display: 'flex', alignSelf: 'stretch', flexShrink: 0 }}>
      <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
          <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

          <div style={{ marginTop: 12, fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', alignItems: 'start', lineHeight: '1.25' }}>
              <div style={{ opacity: 0.9 }}>Tgl Masuk</div><div style={{ overflowWrap: 'anywhere' }}>{formatDateToJakarta(selectedPatient?.tanggalMasuk)}</div>
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
            <button
              type="button"
              onClick={() => setSelectedTab('tatalaksana')}
              style={{
                padding: '8px 14px', borderRadius: 999, border: selectedTab === 'tatalaksana' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'tatalaksana' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'tatalaksana' ? '#0b57d0' : '#374151', cursor: 'pointer'
              }}
            >
              Tatalaksana
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('rujukan')}
              style={{
                padding: '8px 14px', borderRadius: 999, border: selectedTab === 'rujukan' ? '1px solid #60a5fa' : '1px solid #e6eef8',
                background: selectedTab === 'rujukan' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'rujukan' ? '#0b57d0' : '#374151', cursor: 'pointer'
              }}
            >
              Rujukan Ulang
            </button>
            <button
              type="button"
              onClick={handleMarkSelesai}
              disabled={isMarkingSelesai}
              style={{
                padding: '8px 14px', borderRadius: 999, border: '1px solid #e6eef8',
                background: isMarkingSelesai ? '#94a3b8' : '#10b981', color: '#fff', cursor: 'pointer'
              }}
            >
              {isMarkingSelesai ? 'Memproses...' : 'Selesai'}
            </button>
          </div>

          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)' }}>
            {selectedTab === 'anamnesis' && (
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
                              await fetchAnamnesisHistory(pid, { forceRefresh: true })
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400, whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '12px 8px', width: 110 }}>Aksi</th>
                            <th style={{ padding: '12px 8px' }}>Tanggal</th>
                            <th style={{ padding: '12px 8px' }}>Keluhan Utama</th>
                            <th style={{ padding: '12px 8px' }}>Keluhan Tambahan</th>
                            <th style={{ padding: '12px 8px' }}>Status Kehamilan</th>
                            <th style={{ padding: '12px 8px' }}>Riwayat Pengobatan</th>
                            <th style={{ padding: '12px 8px' }}>Riwayat Keluarga</th>
                            <th style={{ padding: '12px 8px' }}>Riwayat Penyakit Dahulu</th>
                            <th style={{ padding: '12px 8px' }}>Riwayat Penyakit Lain</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anamnesisHistory.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                  <button type="button" onClick={() => handleOpenEdit(row)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                  <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideAnamnesis(row) })} disabled={isHidingAnamnesisId === (row?.id_anamnesis ?? row?.idAnamnesis ?? row?.id)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingAnamnesisId === (row?.id_anamnesis ?? row?.idAnamnesis ?? row?.id) ? 'Menghapus...' : 'HAPUS'}</button>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatDateToJakarta(row.date_make ?? row.dateMake)}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.text ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.keluhan_tambahan ?? row.keluhanTambahan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.status_kehamilan ?? row.statusKehamilan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.riwayat_pengobatan ?? row.riwayatPengobatan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.riwayat_keluarga ?? row.riwayatKeluarga ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.riwayat_penyakit_dahulu ?? row.riwayatPenyakitDahulu ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{row.riwayat_penyakit_lain ?? row.riwayatPenyakitLain ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedTab === 'vital' && (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                  {patientCard}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>Pemeriksaan Vital</h3>
                    <div style={{ color: '#475569' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tekanan Darah</label>
                          <input placeholder="120/80" value={tekananDarah} onChange={(e) => setTekananDarah(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Denyut Nadi</label>
                          <input type="number" value={denyutNadi} onChange={(e) => setDenyutNadi(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Suhu Tubuh (°C)</label>
                          <input type="number" step="0.1" value={suhuTubuh} onChange={(e) => setSuhuTubuh(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Frekuensi Napas</label>
                          <input type="number" value={frekuensiNapas} onChange={(e) => setFrekuensiNapas(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Berat Badan (kg)</label>
                          <input type="number" step="0.1" value={beratBadan} onChange={(e) => setBeratBadan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tinggi Badan (cm)</label>
                          <input type="number" step="0.1" value={tinggiBadan} onChange={(e) => setTinggiBadan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <button type="button" onClick={handleSubmitVital} disabled={isSubmittingVital} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingVital ? 'Menyimpan...' : 'Simpan Pemeriksaan'}</button>
                        <div style={{ marginTop: 8, color: vitalMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{vitalMessage}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vital history - full width under the form (matches anamnesis layout) */}
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ margin: '6px 0 12px 0' }}>Riwayat Pemeriksaan Vital</h4>
                  {loadingVitalHistory ? (
                    <div style={{ color: '#64748b' }}>Memuat riwayat pemeriksaan vital...</div>
                  ) : vitalHistoryError ? (
                    <div style={{ color: '#b91c1c' }}>{vitalHistoryError}</div>
                  ) : (!vitalHistory || vitalHistory.length === 0) ? (
                    <div style={{ color: '#64748b' }}>Belum ada riwayat pemeriksaan vital.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '12px 8px', width: 110 }}>Aksi</th>
                            <th style={{ padding: '12px 8px' }}>Tanggal</th>
                            <th style={{ padding: '12px 8px' }}>Tekanan Darah</th>
                            <th style={{ padding: '12px 8px' }}>Denyut Nadi</th>
                            <th style={{ padding: '12px 8px' }}>Suhu Tubuh</th>
                            <th style={{ padding: '12px 8px' }}>Frekuensi Napas</th>
                            <th style={{ padding: '12px 8px' }}>Berat Badan</th>
                            <th style={{ padding: '12px 8px' }}>Tinggi Badan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vitalHistory.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                  <button type="button" onClick={() => handleOpenVitalEdit(r)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                  <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideVital(r) })} disabled={isHidingVitalId === (r?.id_pemeriksaan_vital ?? r?.id)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingVitalId === (r?.id_pemeriksaan_vital ?? r?.id) ? 'Menghapus...' : 'HAPUS'}</button>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatDateToJakarta(r.date_make ?? r.dateMake)}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.tekanan_darah ?? r.tekananDarah ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.denyut_nadi ?? r.denyutNadi ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.suhu_tubuh ?? r.suhuTubuh ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.frekuensi_napas ?? r.frekuensiNapas ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.berat_badan ?? r.beratBadan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.tinggi_badan ?? r.tinggiBadan ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedTab === 'tatalaksana' && (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                  {patientCard}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>Tatalaksana</h3>
                    <div style={{ color: '#475569' }}>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nama Obat</label>
                          <input value={namaObat} onChange={(e) => setNamaObat(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Dosis</label>
                          <input value={dosis} onChange={(e) => setDosis(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Frekuensi</label>
                          <input value={frekuensi} onChange={(e) => setFrekuensi(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Durasi</label>
                          <input value={durasi} onChange={(e) => setDurasi(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cara Pakai</label>
                          <input value={caraPakai} onChange={(e) => setCaraPakai(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Catatan</label>
                          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button type="button" onClick={handleSubmitTatalaksana} disabled={isSubmittingTatalaksana} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingTatalaksana ? 'Menyimpan...' : (isEditingTatalaksanaId ? 'Simpan Perubahan' : 'Simpan')}</button>
                          <button type="button" onClick={() => { setNamaObat(''); setDosis(''); setFrekuensi(''); setDurasi(''); setCaraPakai(''); setCatatan(''); setIsEditingTatalaksanaId(null); setTatalaksanaEditMessage('') }} disabled={isSubmittingTatalaksana} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isEditingTatalaksanaId ? 'Batal Ubah' : 'Batal'}</button>
                        </div>
                        <div style={{ marginTop: 8, color: tatalaksanaMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{tatalaksanaMessage}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Riwayat Tatalaksana - full width under the form */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '6px 0 12px 0' }}>Riwayat Tatalaksana</h4>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handlePrintTatalaksana} type="button" style={{ background: '#38bdf8', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Cetak / Simpan PDF</button>
                    </div>
                  </div>
                  {loadingTatalaksanaHistory ? (
                    <div style={{ color: '#64748b' }}>Memuat riwayat tatalaksana...</div>
                  ) : tatalaksanaHistoryError ? (
                    <div style={{ color: '#b91c1c' }}>{tatalaksanaHistoryError}</div>
                  ) : (!tatalaksanaHistory || tatalaksanaHistory.length === 0) ? (
                    <div style={{ color: '#64748b' }}>Belum ada riwayat tatalaksana.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '12px 8px', width: 110 }}>Aksi</th>
                            <th style={{ padding: '12px 8px' }}>Tanggal</th>
                            <th style={{ padding: '12px 8px' }}>Nama Obat</th>
                            <th style={{ padding: '12px 8px' }}>Dosis</th>
                            <th style={{ padding: '12px 8px' }}>Frekuensi</th>
                            <th style={{ padding: '12px 8px' }}>Durasi</th>
                            <th style={{ padding: '12px 8px' }}>Cara Pakai</th>
                            <th style={{ padding: '12px 8px' }}>Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tatalaksanaHistory.map((t, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                  <button type="button" onClick={() => handleOpenTatalaksanaEdit(t)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                  <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideTatalaksana(t) })} disabled={isHidingTatalaksanaId === (t?.id_tatalaksana ?? t?.id ?? t?.idTatalaksana ?? null)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingTatalaksanaId === (t?.id_tatalaksana ?? t?.id ?? t?.idTatalaksana ?? null) ? 'Menghapus...' : 'HAPUS'}</button>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatDateToJakarta(t.date_make ?? t.dateMake)}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.nama_obat ?? t.namaObat ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.dosis ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.frekuensi ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.durasi ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.cara_pakai ?? t.caraPakai ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{t.catatan ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            {selectedTab === 'rujukan' && (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                  {patientCard}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>Rujukan Ulang</h3>
                    <div style={{ color: '#475569' }}>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Poli Tujuan</label>
                          {loadingPoliList ? (
                            <div style={{ color: '#64748b' }}>Memuat daftar poli...</div>
                          ) : poliListError ? (
                            <div style={{ color: '#b91c1c' }}>{poliListError}</div>
                          ) : (
                            <select value={rujukanTujuan} onChange={(e) => setRujukanTujuan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', background: '#fff' }}>
                              <option value="">Pilih poli tujuan</option>
                              {poliList.filter(p => Number(p.id) !== 1).map(p => (
                                <option key={p.id} value={p.id}>{p.namaPoli}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Diagnosis Sementara</label>
                          <input value={rujukanDiagnosis} onChange={(e) => setRujukanDiagnosis(e.target.value)} placeholder="Suspek ..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Catatan</label>
                          <input value={rujukanCatatan} onChange={(e) => setRujukanCatatan(e.target.value)} placeholder="Catatan .." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button type="button" onClick={handleSubmitRujukan} disabled={isSubmittingRujukan} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingRujukan ? 'Menyimpan...' : 'Simpan Rujukan'}</button>
                          <button type="button" onClick={() => { setRujukanAsal(''); setRujukanTujuan(''); setRujukanDiagnosis(''); setRujukanCatatan('') }} disabled={isSubmittingRujukan} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                        </div>
                        <div style={{ marginTop: 8, color: rujukanMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{rujukanMessage}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '6px 0 12px 0' }}>Riwayat Rujukan Ulang</h4>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handlePrintRujukan} type="button" style={{ background: '#38bdf8', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Cetak / Simpan PDF</button>
                    </div>
                  </div>
                  {loadingRujukanHistory ? (
                    <div style={{ color: '#64748b' }}>Memuat riwayat rujukan...</div>
                  ) : rujukanHistoryError ? (
                    <div style={{ color: '#b91c1c' }}>{rujukanHistoryError}</div>
                  ) : (!rujukanHistory || rujukanHistory.length === 0) ? (
                    <div style={{ color: '#64748b' }}>Belum ada riwayat rujukan ulang.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '12px 8px' }}>Tanggal</th>
                            <th style={{ padding: '12px 8px' }}>Poli Tujuan</th>
                            <th style={{ padding: '12px 8px' }}>Diagnosis Sementara</th>
                            <th style={{ padding: '12px 8px' }}>Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rujukanHistory.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatDateToJakarta(r.date_make ?? r.dateMake)}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_poli_tujuan ?? r.namaPoliTujuan ?? r.nama_poli_tujuan ?? r.nama_poli_tujuan ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.diagnosis_sementara ?? r.diagnosisSementara ?? '-'}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.catatan ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

            {/* Confirmation modal for delete */}
            {confirmVisible && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
                <div style={{ width: 420, background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>{confirmTitle || 'Peringatan'}</h3>
                  <div style={{ padding: '10px 0', color: '#374151' }}>{confirmMessage}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={handleConfirmNo} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>No</button>
                    <button type="button" onClick={handleConfirmYes} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Yes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit modal */}
            {isEditingId && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                <div style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Ubah</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Ringkasan Anamnesis</label>
                      <textarea value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} rows={3} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Keluhan Tambahan</label>
                      <input value={editForm.keluhan_tambahan} onChange={(e) => setEditForm({ ...editForm, keluhan_tambahan: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Status Kehamilan</label>
                      <select value={editForm.status_kehamilan} onChange={(e) => setEditForm({ ...editForm, status_kehamilan: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8', background: '#fff' }}>
                        <option value="">Pilih status kehamilan</option>
                        <option value="tidak hamil">tidak hamil</option>
                        <option value="hamil">hamil</option>
                        <option value="tidak diketahui">tidak diketahui</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Pengobatan</label>
                      <input value={editForm.riwayat_pengobatan} onChange={(e) => setEditForm({ ...editForm, riwayat_pengobatan: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Keluarga</label>
                      <input value={editForm.riwayat_keluarga} onChange={(e) => setEditForm({ ...editForm, riwayat_keluarga: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Penyakit Dahulu</label>
                      <input value={editForm.riwayat_penyakit_dahulu} onChange={(e) => setEditForm({ ...editForm, riwayat_penyakit_dahulu: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Riwayat Penyakit Lain</label>
                      <input value={editForm.riwayat_penyakit_lain} onChange={(e) => setEditForm({ ...editForm, riwayat_penyakit_lain: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={handleSubmitEdit} disabled={isSubmittingEdit} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingEdit ? 'Menyimpan...' : 'Simpan'}</button>
                      <button onClick={() => setIsEditingId(null)} disabled={isSubmittingEdit} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Tatalaksana modal */}
            {isEditingTatalaksanaId && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                <div style={{ width: 540, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Ubah Tatalaksana</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nama Obat</label>
                      <input value={namaObat} onChange={(e) => setNamaObat(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Dosis</label>
                      <input value={dosis} onChange={(e) => setDosis(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Frekuensi</label>
                      <input value={frekuensi} onChange={(e) => setFrekuensi(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Durasi</label>
                      <input value={durasi} onChange={(e) => setDurasi(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cara Pakai</label>
                      <input value={caraPakai} onChange={(e) => setCaraPakai(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Catatan</label>
                      <input value={catatan} onChange={(e) => setCatatan(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={handleSubmitTatalaksana} disabled={isSubmittingTatalaksana} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingTatalaksana ? 'Menyimpan...' : 'Simpan'}</button>
                      <button onClick={() => setIsEditingTatalaksanaId(null)} disabled={isSubmittingTatalaksana} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                    </div>
                    <div style={{ color: tatalaksanaEditMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{tatalaksanaEditMessage}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Vital modal */}
            {isEditingVitalId && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                <div style={{ width: 540, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Ubah Pemeriksaan Vital</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tekanan Darah</label>
                      <input value={editVitalForm.tekanan_darah} onChange={(e) => setEditVitalForm({ ...editVitalForm, tekanan_darah: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Denyut Nadi</label>
                        <input type="number" value={editVitalForm.denyut_nadi} onChange={(e) => setEditVitalForm({ ...editVitalForm, denyut_nadi: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Suhu Tubuh (°C)</label>
                        <input type="number" step="0.1" value={editVitalForm.suhu_tubuh} onChange={(e) => setEditVitalForm({ ...editVitalForm, suhu_tubuh: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Frekuensi Napas</label>
                        <input type="number" value={editVitalForm.frekuensi_napas} onChange={(e) => setEditVitalForm({ ...editVitalForm, frekuensi_napas: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Berat Badan (kg)</label>
                        <input type="number" step="0.1" value={editVitalForm.berat_badan} onChange={(e) => setEditVitalForm({ ...editVitalForm, berat_badan: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tinggi Badan (cm)</label>
                      <input type="number" step="0.1" value={editVitalForm.tinggi_badan} onChange={(e) => setEditVitalForm({ ...editVitalForm, tinggi_badan: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={handleSubmitVitalEdit} disabled={isSubmittingVitalEdit} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingVitalEdit ? 'Menyimpan...' : 'Simpan'}</button>
                      <button onClick={() => setIsEditingVitalId(null)} disabled={isSubmittingVitalEdit} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                    </div>
                    <div style={{ color: vitalEditMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{vitalEditMessage}</div>
                  </div>
                </div>
              </div>
            )}

        <section style={{padding:24}}>
          <div style={{color:'#374151'}}>Ini adalah tampilan awal untuk <strong>Poli Umum</strong>. Sidebar dan header sudah tersedia.</div>
        </section>
      </main>
    </div>
  )
}

export default PoliUmum
