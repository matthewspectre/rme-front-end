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
  const [myDokterId, setMyDokterId] = useState(null)
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
              if (res && res.ok) {
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
        setMyDokterId(dokterId)

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
  const [labForm, setLabForm] = useState({
    hb: '', ht: '', leukosit: '', trombosit: '', gulaPuasa: '', gulaSewaktu: '', hba1c: '', kolesterolTotal: '', hdl: '', ldl: '', trigliserida: '', sgot: '', sgpt: '', ureum: '', kreatinin: '', asamUrat: '', natrium: '', kalium: '', klorida: ''
  })
  const [labSubmitting, setLabSubmitting] = useState(false)
  const [labMessage, setLabMessage] = useState('')
  const [labError, setLabError] = useState('')
  const [labHistory, setLabHistory] = useState([])
  const [loadingLabHistory, setLoadingLabHistory] = useState(false)
  const [labHistoryError, setLabHistoryError] = useState('')
  // EKG form state
  const [ekgForm, setEkgForm] = useState({ detakJantung: '', irama: '', prInterval: '', qrsDuration: '', qt_qtc_interval: '', axisJantung: '', st_elevation_depression: '', t_wave_abnormality: '', interpretasi_dokter: '' })
  const [ekgSubmitting, setEkgSubmitting] = useState(false)
  const [ekgMessage, setEkgMessage] = useState('')
  const [ekgError, setEkgError] = useState('')
  // EKG history
  const [ekgHistory, setEkgHistory] = useState([])
  const [loadingEkgHistory, setLoadingEkgHistory] = useState(false)
  const [ekgHistoryError, setEkgHistoryError] = useState('')
  // Diagnosis notes (expanded form)
  const [diagnosisForm, setDiagnosisForm] = useState({
    tanggal: new Date().toISOString(),
    diagnosis_utama: '',
    diagnosis_sekunder: [''],
    diagnosis_banding: [''],
    dasar_diagnosis: [],
    status: 'Terkonfirmasi',
    catatan: ''
  })
  const [diagnosisSubmitting, setDiagnosisSubmitting] = useState(false)
  const [diagnosisMessage, setDiagnosisMessage] = useState('')
  const [diagnosisError, setDiagnosisError] = useState('')
  const [diagnosisHistory, setDiagnosisHistory] = useState([])
  const [loadingDiagnosisHistory, setLoadingDiagnosisHistory] = useState(false)
  const [diagnosisHistoryError, setDiagnosisHistoryError] = useState('')
  const [icdList, setIcdList] = useState([])
  const [loadingIcd, setLoadingIcd] = useState(false)
  const [icdError, setIcdError] = useState('')
  const [isEditingEkgId, setIsEditingEkgId] = useState(null)
  const [isSubmittingEkgEdit, setIsSubmittingEkgEdit] = useState(false)
  const [editEkgForm, setEditEkgForm] = useState({ detakJantung: '', irama: '', prInterval: '', qrsDuration: '', qt_qtc_interval: '', axisJantung: '', st_elevation_depression: '', t_wave_abnormality: '', interpretasi_dokter: '' })
  const [ekgEditMessage, setEkgEditMessage] = useState('')
  const [isHidingEkgId, setIsHidingEkgId] = useState(null)
  const [isEditingLabId, setIsEditingLabId] = useState(null)
  const [isSubmittingLabEdit, setIsSubmittingLabEdit] = useState(false)
  const [editLabForm, setEditLabForm] = useState({
    hb: '', ht: '', leukosit: '', trombosit: '', gulaPuasa: '', gulaSewaktu: '', hba1c: '', kolesterolTotal: '', hdl: '', ldl: '', trigliserida: '', sgot: '', sgpt: '', ureum: '', kreatinin: '', asamUrat: '', natrium: '', kalium: '', klorida: ''
  })
  const [labEditMessage, setLabEditMessage] = useState('')
  const [isHidingLabId, setIsHidingLabId] = useState(null)
  const [isEditingDiagnosisId, setIsEditingDiagnosisId] = useState(null)
  const [isSubmittingDiagnosisEdit, setIsSubmittingDiagnosisEdit] = useState(false)
  const [editDiagnosisForm, setEditDiagnosisForm] = useState({ tanggal: new Date().toISOString(), diagnosis_utama: '', diagnosis_sekunder: [''], diagnosis_banding: [''], dasar_diagnosis: [], status: 'Terkonfirmasi', catatan: '' })
  const [diagnosisEditMessage, setDiagnosisEditMessage] = useState('')
  const [isHidingDiagnosisId, setIsHidingDiagnosisId] = useState(null)
  // rujukan ulang state (similar to PoliUmum)
  const [rujukanAsal, setRujukanAsal] = useState('')
  const [rujukanTujuan, setRujukanTujuan] = useState('')
  const [rujukanDiagnosis, setRujukanDiagnosis] = useState('')
  const [rujukanCatatan, setRujukanCatatan] = useState('')
  const [rujukanMessage, setRujukanMessage] = useState('')
  const [isSubmittingRujukan, setIsSubmittingRujukan] = useState(false)
  const [rujukanHistory, setRujukanHistory] = useState([])
  const [loadingRujukanHistory, setLoadingRujukanHistory] = useState(false)
  const [rujukanHistoryError, setRujukanHistoryError] = useState('')
  // poli list for dropdown
  const [poliList, setPoliList] = useState([])
  const [loadingPoliList, setLoadingPoliList] = useState(false)
  const [poliListError, setPoliListError] = useState('')
  // confirmation modal state (for delete actions)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const confirmCallback = React.useRef(null)

  // hover + selesai states (copied from PoliUmum)
  const [hoveredPatientId, setHoveredPatientId] = useState(null)
  const hoverTimer = React.useRef(null)
  const [isMarkingSelesai, setIsMarkingSelesai] = useState(false)
  const [markingId, setMarkingId] = useState(null)

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
      if (!r.ok) { setSelectedPatient(null); return }
      const data = await r.json()
      const p = Array.isArray(data) ? data[0] : data
      setSelectedPatient(p || null)
    } catch (e) {
      setSelectedPatient(null)
    }
  }

  const handleLabChange = (e) => {
    const { name, value } = e.target
    setLabForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitLab = async (e) => {
    e.preventDefault()
    setLabError('')
    setLabMessage('')
    if (!selectedPatient) { setLabError('Pilih pasien terlebih dahulu'); return }
    const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? null
  // use myDokterId determined when loading antrian; fallback to stored user
  let dokterId = myDokterId ?? (user?.idDokter ?? user?.dokterId ?? user?.id_dokter ?? null)
  if (!dokterId) dokterId = null

    const payload = {
      idPasien: Number(idPasien),
      idDokter: dokterId ? Number(dokterId) : null,
      hb: labForm.hb === '' ? null : Number(labForm.hb),
      ht: labForm.ht === '' ? null : Number(labForm.ht),
      leukosit: labForm.leukosit === '' ? null : Number(labForm.leukosit),
      trombosit: labForm.trombosit === '' ? null : Number(labForm.trombosit),
      gulaPuasa: labForm.gulaPuasa === '' ? null : Number(labForm.gulaPuasa),
      gulaSewaktu: labForm.gulaSewaktu === '' ? null : Number(labForm.gulaSewaktu),
      hba1c: labForm.hba1c === '' ? null : Number(labForm.hba1c),
      kolesterolTotal: labForm.kolesterolTotal === '' ? null : Number(labForm.kolesterolTotal),
      hdl: labForm.hdl === '' ? null : Number(labForm.hdl),
      ldl: labForm.ldl === '' ? null : Number(labForm.ldl),
      trigliserida: labForm.trigliserida === '' ? null : Number(labForm.trigliserida),
      sgot: labForm.sgot === '' ? null : Number(labForm.sgot),
      sgpt: labForm.sgpt === '' ? null : Number(labForm.sgpt),
      ureum: labForm.ureum === '' ? null : Number(labForm.ureum),
      kreatinin: labForm.kreatinin === '' ? null : Number(labForm.kreatinin),
      asamUrat: labForm.asamUrat === '' ? null : Number(labForm.asamUrat),
      natrium: labForm.natrium === '' ? null : Number(labForm.natrium),
      kalium: labForm.kalium === '' ? null : Number(labForm.kalium),
      klorida: labForm.klorida === '' ? null : Number(labForm.klorida),
    }

    setLabSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Gagal menyimpan pemeriksaan laboratorium')
      }
      setLabMessage('Pemeriksaan laboratorium tersimpan')
      setLabForm({ hb: '', ht: '', leukosit: '', trombosit: '', gulaPuasa: '', gulaSewaktu: '', hba1c: '', kolesterolTotal: '', hdl: '', ldl: '', trigliserida: '', sgot: '', sgpt: '', ureum: '', kreatinin: '', asamUrat: '', natrium: '', kalium: '', klorida: '' })
      // refresh lab history so new record appears immediately
      try {
        const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (res2 && res2.ok) {
          const data = await res2.json()
          setLabHistory(Array.isArray(data) ? data : [])
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err)
      setLabError(String(err.message || err))
    } finally {
      setLabSubmitting(false)
    }
  }

  const handleEkgChange = (e) => {
    const { name, value } = e.target
    setEkgForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitEkg = async (e) => {
    e.preventDefault()
    setEkgError('')
    setEkgMessage('')
    if (!selectedPatient) { setEkgError('Pilih pasien terlebih dahulu'); return }
    const idPasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? null
    let dokterId = myDokterId ?? (user?.idDokter ?? user?.dokterId ?? user?.id_dokter ?? null)
    if (!dokterId) dokterId = null

    const payload = {
      idPasien: Number(idPasien),
      idDokter: dokterId ? Number(dokterId) : null,
      detakJantung: ekgForm.detakJantung === '' ? null : Number(ekgForm.detakJantung),
      irama: ekgForm.irama || null,
      prInterval: ekgForm.prInterval === '' ? null : Number(ekgForm.prInterval),
      qrsDuration: ekgForm.qrsDuration === '' ? null : Number(ekgForm.qrsDuration),
      qt_qtc_interval: ekgForm.qt_qtc_interval === '' ? null : Number(ekgForm.qt_qtc_interval),
      axisJantung: ekgForm.axisJantung || null,
      st_elevation_depression: ekgForm.st_elevation_depression || null,
      t_wave_abnormality: ekgForm.t_wave_abnormality || null,
      interpretasi_dokter: ekgForm.interpretasi_dokter || null
    }

    setEkgSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/pemeriksaan_ekg`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Gagal menyimpan pemeriksaan EKG')
      }
      setEkgMessage('Pemeriksaan EKG tersimpan')
      setEkgForm({ detakJantung: '', irama: '', prInterval: '', qrsDuration: '', qt_qtc_interval: '', axisJantung: '', st_elevation_depression: '', t_wave_abnormality: '', interpretasi_dokter: '' })
      // refresh EKG history so new record appears immediately
      try {
        const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (res2 && res2.ok) {
          const data = await res2.json()
          setEkgHistory(Array.isArray(data) ? data : [])
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err)
      setEkgError(String(err.message || err))
    } finally {
      setEkgSubmitting(false)
    }
  }

  // Diagnosis handlers
  const handleDiagnosisChange = (name, value) => {
    setDiagnosisForm(prev => ({ ...prev, [name]: value }))
  }

  const addSecondary = () => setDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: [...prev.diagnosis_sekunder, ''] }))
  const removeSecondary = (idx) => setDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: prev.diagnosis_sekunder.filter((_,i) => i !== idx) }))
  const setSecondary = (idx, value) => setDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: prev.diagnosis_sekunder.map((v,i) => i===idx ? value : v) }))

  const addBanding = () => setDiagnosisForm(prev => ({ ...prev, diagnosis_banding: [...prev.diagnosis_banding, ''] }))
  const removeBanding = (idx) => setDiagnosisForm(prev => ({ ...prev, diagnosis_banding: prev.diagnosis_banding.filter((_,i) => i !== idx) }))
  const setBanding = (idx, value) => setDiagnosisForm(prev => ({ ...prev, diagnosis_banding: prev.diagnosis_banding.map((v,i) => i===idx ? value : v) }))

  const toggleDasar = (value) => {
    setDiagnosisForm(prev => {
      const has = prev.dasar_diagnosis.includes(value)
      return { ...prev, dasar_diagnosis: has ? prev.dasar_diagnosis.filter(d => d !== value) : [...prev.dasar_diagnosis, value] }
    })
  }

  const handleSubmitDiagnosis = async (e) => {
    e.preventDefault()
    setDiagnosisError('')
    setDiagnosisMessage('')
    if (!selectedPatient) { setDiagnosisError('Pilih pasien terlebih dahulu'); return }
    const id_pasien = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? null
    let id_dokter = myDokterId ?? (user?.idDokter ?? user?.dokterId ?? user?.id_dokter ?? null)
    if (!id_dokter) id_dokter = null

    const payload = {
      id_pasien: Number(id_pasien),
      id_dokter: id_dokter ? Number(id_dokter) : null,
      tanggal: (new Date(diagnosisForm.tanggal)).toISOString(),
      diagnosis_utama: diagnosisForm.diagnosis_utama ? { kode_icd: diagnosisForm.diagnosis_utama } : null,
      diagnosis_sekunder: diagnosisForm.diagnosis_sekunder.filter(Boolean).map(k => ({ kode_icd: k })),
      diagnosis_banding: diagnosisForm.diagnosis_banding.filter(Boolean),
      status: diagnosisForm.status || 'Terkonfirmasi',
      dasar_diagnosis: diagnosisForm.dasar_diagnosis || [],
      catatan: diagnosisForm.catatan || null
    }

    setDiagnosisSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/diagnosis`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Gagal menyimpan catatan diagnosis')
      }
      setDiagnosisMessage('Catatan diagnosis tersimpan')
      setDiagnosisForm({ tanggal: new Date().toISOString(), diagnosis_utama: '', diagnosis_sekunder: [''], diagnosis_banding: [''], dasar_diagnosis: [], status: 'Terkonfirmasi', catatan: '' })
      // refresh history for current patient
      try {
        const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? (antrian && antrian.length > 0 ? (antrian[0]?.idPasien ?? antrian[0]?.id) : null)
        if (pid) {
          const diagnosisUrl2 = `${API_BASE_URL}/diagnosis?idPasien=${encodeURIComponent(pid)}`
          console.debug('handleSubmitDiagnosis -> refreshing', { diagnosisUrl2, API_BASE_URL })
          let res2 = await fetch(diagnosisUrl2, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
               if (!res2 || !res2.ok) {
                 throw new Error('Gagal memuat riwayat catatan diagnosis')
               }
          if (res2 && res2.ok) {
            const contentType2 = res2.headers && res2.headers.get ? (res2.headers.get('content-type') || '') : ''
            if (!contentType2.includes('application/json')) {
              const text = await res2.text().catch(() => '')
              setDiagnosisHistoryError(`Unexpected response (not JSON): ${(text || '').slice(0,400)}`)
              setDiagnosisHistory([])
            } else {
              const data = await res2.json()
              setDiagnosisHistory(Array.isArray(data) ? data : [])
            }
          }
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err)
      setDiagnosisError(String(err.message || err))
    } finally { setDiagnosisSubmitting(false) }
  }

  const handleEditEkgChange = (e) => {
    const { name, value } = e.target
    setEditEkgForm(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenEkgEdit = async (row) => {
    const eid = row?.id ?? row?.id_pemeriksaan_ekg ?? null
    if (!eid) return
    setIsEditingEkgId(eid)
    setEkgEditMessage('')
    const proxyUrl = `${API_BASE_URL}/pemeriksaan_ekg/${encodeURIComponent(eid)}`
    const backendUrl = `${API_BASE_URL}/pemeriksaan_ekg/${encodeURIComponent(eid)}`
    const urls = [proxyUrl, backendUrl]
    let lastErr = null
    try {
      for (const u of urls) {
        try {
          const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            const data = await res.json()
            const d = Array.isArray(data) ? data[0] : data
            setEditEkgForm({
              detakJantung: d.detakJantung ?? d.detak_jantung ?? '',
              irama: d.irama ?? '',
              prInterval: d.prInterval ?? d.pr_interval ?? '',
              qrsDuration: d.qrsDuration ?? d.qrs_duration ?? '',
              qt_qtc_interval: d.qt_qtc_interval ?? d.qt_qtc ?? '',
              axisJantung: d.axisJantung ?? d.axis_jantung ?? '',
              st_elevation_depression: d.st_elevation_depression ?? '',
              t_wave_abnormality: d.t_wave_abnormality ?? '',
              interpretasi_dokter: d.interpretasi_dokter ?? d.interpretasiDokter ?? ''
            })
            return
          }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      console.error('Failed loading ekg for edit', lastErr)
      setEkgEditMessage('Gagal memuat data untuk ubah')
      setIsEditingEkgId(null)
    } catch (e) {
      console.error('Error opening ekg edit', e)
      setEkgEditMessage('Gagal memuat data untuk ubah')
      setIsEditingEkgId(null)
    }
  }

  const handleSubmitEkgEdit = async () => {
    const eid = isEditingEkgId
    if (!eid) return
    setIsSubmittingEkgEdit(true)
    setEkgEditMessage('')
    try {
      const payload = {
        detakJantung: editEkgForm.detakJantung === '' ? null : Number(editEkgForm.detakJantung),
        irama: editEkgForm.irama || null,
        prInterval: editEkgForm.prInterval === '' ? null : Number(editEkgForm.prInterval),
        qrsDuration: editEkgForm.qrsDuration === '' ? null : Number(editEkgForm.qrsDuration),
        qt_qtc_interval: editEkgForm.qt_qtc_interval === '' ? null : Number(editEkgForm.qt_qtc_interval),
        axisJantung: editEkgForm.axisJantung || null,
        st_elevation_depression: editEkgForm.st_elevation_depression || null,
        t_wave_abnormality: editEkgForm.t_wave_abnormality || null,
        interpretasi_dokter: editEkgForm.interpretasi_dokter || null
      }
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const proxyUrl = `${API_BASE_URL}/pemeriksaan_ekg/${encodeURIComponent(eid)}`
      const backendUrl = `${API_BASE_URL}/pemeriksaan_ekg/${encodeURIComponent(eid)}`
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
        console.error('Failed updating ekg', lastErr)
        setEkgEditMessage('Gagal memperbarui pemeriksaan EKG')
        return
      }
      // refresh history
      try { const res = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`); if (res && res.ok) { const data = await res.json(); setEkgHistory(Array.isArray(data) ? data : []) } } catch (e) { /* ignore */ }
      setEkgEditMessage('Pemeriksaan EKG berhasil diperbarui')
      setIsEditingEkgId(null)
    } catch (e) {
      console.error('Error submitting ekg edit', e)
      setEkgEditMessage('Gagal memperbarui pemeriksaan EKG')
    } finally {
      setIsSubmittingEkgEdit(false)
    }
  }

  const handleHideEkg = async (row) => {
    const eid = row?.id ?? null
    if (!eid) return
    setIsHidingEkgId(eid)
    try {
      const proxyUrl = `${API_BASE_URL}/pemeriksaan_ekg/${encodeURIComponent(eid)}/hide`
      const res = await fetch(proxyUrl, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
      if (!res || !res.ok) {
        const text = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''))
        console.error('Failed to hide ekg (backend)', res && res.status, text)
        setEkgEditMessage('Gagal menghapus riwayat pemeriksaan EKG')
        return
      }
      // refresh
      try { const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`); if (res2 && res2.ok) { const data = await res2.json(); setEkgHistory(Array.isArray(data) ? data : []) } } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error hiding ekg', e)
      setEkgEditMessage('Gagal menghapus riwayat pemeriksaan EKG')
    } finally {
      setIsHidingEkgId(null)
    }
  }

  const handleEditLabChange = (e) => {
    const { name, value } = e.target
    setEditLabForm(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenLabEdit = async (row) => {
    const lid = row?.id ?? row?.id_pemeriksaan_laboratorium ?? row?.idPemeriksaan ?? null
    if (!lid) return
    setIsEditingLabId(lid)
    setLabEditMessage('')
    const proxyUrl = `${API_BASE_URL}/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
    const backendUrl = `${API_BASE_URL}/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
    const urls = [proxyUrl, backendUrl]
    let lastErr = null
    try {
      for (const u of urls) {
        try {
          const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res && res.ok) {
            const data = await res.json()
            const d = Array.isArray(data) ? data[0] : data
            setEditLabForm({
              hb: d.hb ?? '', ht: d.ht ?? '', leukosit: d.leukosit ?? '', trombosit: d.trombosit ?? '', gulaPuasa: d.gulaPuasa ?? d.gula_puasa ?? '', gulaSewaktu: d.gulaSewaktu ?? d.gula_sewaktu ?? '', hba1c: d.hba1c ?? '', kolesterolTotal: d.kolesterolTotal ?? d.kolesterol_total ?? '', hdl: d.hdl ?? '', ldl: d.ldl ?? '', trigliserida: d.trigliserida ?? '', sgot: d.sgot ?? '', sgpt: d.sgpt ?? '', ureum: d.ureum ?? '', kreatinin: d.kreatinin ?? '', asamUrat: d.asamUrat ?? d.asam_urat ?? '', natrium: d.natrium ?? '', kalium: d.kalium ?? '', klorida: d.klorida ?? ''
            })
            return
          }
          lastErr = `HTTP ${res.status} ${res.statusText} @ ${u}`
        } catch (e) { lastErr = e }
      }
      console.error('Failed loading lab for edit', lastErr)
      setLabEditMessage('Gagal memuat data untuk ubah')
      setIsEditingLabId(null)
    } catch (e) {
      console.error('Error opening lab edit', e)
      setLabEditMessage('Gagal memuat data untuk ubah')
      setIsEditingLabId(null)
    }
  }

  const handleSubmitLabEdit = async () => {
    const lid = isEditingLabId
    if (!lid) return
    setIsSubmittingLabEdit(true)
    setLabEditMessage('')
    try {
      const payload = {
        hb: editLabForm.hb === '' ? null : Number(editLabForm.hb),
        ht: editLabForm.ht === '' ? null : Number(editLabForm.ht),
        leukosit: editLabForm.leukosit === '' ? null : Number(editLabForm.leukosit),
        trombosit: editLabForm.trombosit === '' ? null : Number(editLabForm.trombosit),
        gulaPuasa: editLabForm.gulaPuasa === '' ? null : Number(editLabForm.gulaPuasa),
        gulaSewaktu: editLabForm.gulaSewaktu === '' ? null : Number(editLabForm.gulaSewaktu),
        hba1c: editLabForm.hba1c === '' ? null : Number(editLabForm.hba1c),
        kolesterolTotal: editLabForm.kolesterolTotal === '' ? null : Number(editLabForm.kolesterolTotal),
        hdl: editLabForm.hdl === '' ? null : Number(editLabForm.hdl),
        ldl: editLabForm.ldl === '' ? null : Number(editLabForm.ldl),
        trigliserida: editLabForm.trigliserida === '' ? null : Number(editLabForm.trigliserida),
        sgot: editLabForm.sgot === '' ? null : Number(editLabForm.sgot),
        sgpt: editLabForm.sgpt === '' ? null : Number(editLabForm.sgpt),
        ureum: editLabForm.ureum === '' ? null : Number(editLabForm.ureum),
        kreatinin: editLabForm.kreatinin === '' ? null : Number(editLabForm.kreatinin),
        asamUrat: editLabForm.asamUrat === '' ? null : Number(editLabForm.asamUrat),
        natrium: editLabForm.natrium === '' ? null : Number(editLabForm.natrium),
        kalium: editLabForm.kalium === '' ? null : Number(editLabForm.kalium),
        klorida: editLabForm.klorida === '' ? null : Number(editLabForm.klorida)
      }
      // remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const proxyUrl = `${API_BASE_URL}/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
      const backendUrl = `${API_BASE_URL}/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
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
        console.error('Failed updating lab', lastErr)
        setLabEditMessage('Gagal memperbarui pemeriksaan laboratorium')
        return
      }
      // refresh history
      try { const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id); const res = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`); if (res && res.ok) { const data = await res.json(); setLabHistory(Array.isArray(data) ? data : []) } } catch (e) { /* ignore */ }
      setLabEditMessage('Pemeriksaan laboratorium berhasil diperbarui')
      setIsEditingLabId(null)
    } catch (e) {
      console.error('Error submitting lab edit', e)
      setLabEditMessage('Gagal memperbarui pemeriksaan laboratorium')
    } finally {
      setIsSubmittingLabEdit(false)
    }
  }

  const handleHideLab = async (row) => {
    const lid = row?.id ?? null
    if (!lid) return
    setIsHidingLabId(lid)
    try {
      // Use proxy (API_BASE_URL) to avoid CORS issues instead of direct backend URL
      const proxyUrl = `${API_BASE_URL}/pemeriksaan_laboratorium/${encodeURIComponent(lid)}/hide`
      const res = await fetch(proxyUrl, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
      if (!res || !res.ok) {
        const text = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''))
        console.error('Failed to hide lab (backend)', res && res.status, text)
        setLabEditMessage('Gagal menghapus riwayat pemeriksaan laboratorium')
        return
      }
      // refresh
      try { const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`); if (res2 && res2.ok) { const data = await res2.json(); setLabHistory(Array.isArray(data) ? data : []) } } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error hiding lab', e)
      setLabEditMessage('Gagal menghapus riwayat pemeriksaan laboratorium')
    } finally {
      setIsHidingLabId(null)
    }
  }

  const handleEditDiagnosisChange = (name, value) => {
    setEditDiagnosisForm(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenDiagnosisEdit = async (row) => {
    const did = row?.id ?? row?.id_diagnosis ?? null
    if (!did) return
    setIsEditingDiagnosisId(did)
    setDiagnosisEditMessage('')
    try {
      const d = row
      setEditDiagnosisForm({
        tanggal: (d.tanggal || d.waktu || d.createdAt) ? new Date(d.tanggal || d.waktu || d.createdAt).toISOString() : new Date().toISOString(),
        diagnosis_utama: d.diagnosis_utama && (d.diagnosis_utama.kode_icd || d.diagnosis_utama.kode) ? (d.diagnosis_utama.kode_icd || d.diagnosis_utama.kode) : (typeof d.diagnosis_utama === 'string' ? d.diagnosis_utama : ''),
        diagnosis_sekunder: Array.isArray(d.diagnosis_sekunder) ? d.diagnosis_sekunder.map(s => (s && (s.kode_icd || s.kode) ? (s.kode_icd || s.kode) : (typeof s === 'string' ? s : ''))) : [''],
        diagnosis_banding: Array.isArray(d.diagnosis_banding) ? d.diagnosis_banding.slice() : (d.diagnosis_banding ? [String(d.diagnosis_banding)] : ['']),
        dasar_diagnosis: Array.isArray(d.dasar_diagnosis) ? d.dasar_diagnosis.slice() : (d.dasar_diagnosis ? [String(d.dasar_diagnosis)] : []),
        status: d.status || 'Terkonfirmasi',
        catatan: d.catatan || ''
      })
    } catch (e) {
      console.error('Failed opening diagnosis edit', e)
      setDiagnosisEditMessage('Gagal memuat data untuk ubah')
      setIsEditingDiagnosisId(null)
    }
  }

  const handleSubmitDiagnosisEdit = async () => {
    const did = isEditingDiagnosisId
    if (!did) return
    setIsSubmittingDiagnosisEdit(true)
    setDiagnosisEditMessage('')
    try {
      const payload = {
        tanggal: (new Date(editDiagnosisForm.tanggal)).toISOString(),
        diagnosis_utama: editDiagnosisForm.diagnosis_utama ? { kode_icd: editDiagnosisForm.diagnosis_utama } : null,
        diagnosis_sekunder: Array.isArray(editDiagnosisForm.diagnosis_sekunder) ? editDiagnosisForm.diagnosis_sekunder.filter(Boolean).map(k => ({ kode_icd: k })) : [],
        diagnosis_banding: Array.isArray(editDiagnosisForm.diagnosis_banding) ? editDiagnosisForm.diagnosis_banding.filter(Boolean) : [],
        status: editDiagnosisForm.status || 'Terkonfirmasi',
        dasar_diagnosis: Array.isArray(editDiagnosisForm.dasar_diagnosis) ? editDiagnosisForm.dasar_diagnosis : [],
        catatan: editDiagnosisForm.catatan || null
      }

      const urls = [`${API_BASE_URL}/diagnosis/${encodeURIComponent(did)}`, `http://localhost:8080/diagnosis/${encodeURIComponent(did)}`]
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
        console.error('Failed updating diagnosis', lastErr)
        setDiagnosisEditMessage('Gagal memperbarui catatan diagnosis')
        return
      }
      // refresh history
      try {
        const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? (antrian && antrian.length > 0 ? (antrian[0]?.idPasien ?? antrian[0]?.id) : null)
        if (pid) {
          const res2 = await fetch(`${API_BASE_URL}/diagnosis?idPasien=${encodeURIComponent(pid)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
          if (res2 && res2.ok) { const data = await res2.json(); setDiagnosisHistory(Array.isArray(data) ? data : []) }
        }
      } catch (e) { /* ignore */ }
      setDiagnosisEditMessage('Catatan diagnosis berhasil diperbarui')
      setIsEditingDiagnosisId(null)
    } catch (e) {
      console.error('Error submitting diagnosis edit', e)
      setDiagnosisEditMessage('Gagal memperbarui catatan diagnosis')
    } finally {
      setIsSubmittingDiagnosisEdit(false)
    }
  }

  const handleHideDiagnosis = async (row) => {
    const did = row?.id ?? row?.id_diagnosis ?? null
    if (!did) return
    setIsHidingDiagnosisId(did)
    try {
      const proxyUrl = `${API_BASE_URL}/diagnosis/${encodeURIComponent(did)}/hide`
      const res = await fetch(proxyUrl, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, cache: 'no-store' })
      if (!res || !res.ok) {
        const text = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''))
        console.error('Failed to hide diagnosis', res && res.status, text)
        return
      }
      // refresh
      try {
        const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? (antrian ? (antrian[0]?.idPasien ?? antrian[0]?.id) : null)
        const res2 = await fetch(`${API_BASE_URL}/diagnosis?idPasien=${encodeURIComponent(pid)}`)
        if (res2 && res2.ok) {
          const data = await res2.json()
          setDiagnosisHistory(Array.isArray(data) ? data : [])
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error hiding diagnosis', e)
    } finally {
      setIsHidingDiagnosisId(null)
    }
  }

  const formatToJakarta = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch (e) { return String(iso) }
  }

  const formatToDateTime = (iso) => {
    if (!iso) return '-'
    try {
      // Force formatting in Asia/Jakarta (UTC+7) and produce DD/MM/YYYY HH:mm:ss
      const d = new Date(iso)
      const opts = { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
      const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(d)
      const map = {}
      parts.forEach(p => { if (p.type && p.type !== 'literal') map[p.type] = p.value })
      const day = map.day || ''
      const month = map.month || ''
      const year = map.year || ''
      const hour = (map.hour || '').padStart ? (map.hour || '').padStart(2, '0') : (map.hour || '')
      const minute = (map.minute || '').padStart ? (map.minute || '').padStart(2, '0') : (map.minute || '')
      const second = (map.second || '').padStart ? (map.second || '').padStart(2, '0') : (map.second || '')
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`
    } catch (e) { return String(iso) }
  }

  // small helper to escape text for HTML (used by print)
  const escapeHtml = (s) => {
    if (s === null || s === undefined) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  const fetchRujukanHistory = async (id, opts = {}) => {
    try {
      if (!id) {
        setRujukanHistory([])
        setRujukanHistoryError('')
        return
      }
      if (!opts.forceRefresh && String(id) === String((selectedPatient && (selectedPatient.id || selectedPatient.idPasien)) || '')) {
        // allow normal caching behavior
      }
      setLoadingRujukanHistory(true)
      setRujukanHistoryError('')
      setRujukanHistory([])
      const proxyUrls = [
        `${API_BASE_URL}/rujuk_ulang/?idPasien=${encodeURIComponent(id)}`,
        `${API_BASE_URL}/rujuk_ulang?idPasien=${encodeURIComponent(id)}`
      ]
      const backendUrls = [
        `http://localhost:8080/rujuk_ulang/?idPasien=${encodeURIComponent(id)}`,
        `http://localhost:8080/rujuk_ulang?idPasien=${encodeURIComponent(id)}`
      ]
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

  // fetch poli list for dropdown
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
    try { fetchPoliList() } catch (e) { /* ignore */ }
  }, [])

  const handleSubmitRujukan = async () => {
    setRujukanMessage('')
    setIsSubmittingRujukan(true)
    try {
      const pid = (selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? (antrian[0]?.idPasien ?? antrian[0]?.id))
      if (!pid) throw new Error('Tidak ada pasien terpilih.')
      const payload = {
        idPasien: Number(pid),
        poliAsal: 1,
        idDokter: myDokterId ? Number(myDokterId) : undefined,
        poliTujuan: rujukanTujuan ? Number(rujukanTujuan) : undefined,
        diagnosis_sementara: rujukanDiagnosis,
        catatan: rujukanCatatan
      }
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

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
        } catch (e) { lastErr = e }
      }
      if (!res || !res.ok) {
        console.error('Failed submitting rujukan', lastErr)
        setRujukanMessage('Gagal menyimpan rujukan: ' + String(lastErr))
        return
      }
      setRujukanMessage('Rujukan tersimpan')
      setRujukanAsal('')
      setRujukanTujuan('')
      setRujukanDiagnosis('')
      setRujukanCatatan('')
      try { await fetchRujukanHistory(pid, { forceRefresh: true }) } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Error saving rujukan', e)
      setRujukanMessage('Gagal menyimpan rujukan: ' + (e.message || e))
    } finally {
      setIsSubmittingRujukan(false)
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
        const date = formatToJakarta(r.date_make ?? r.dateMake)
        const namaPasien = r.nama_pasien ?? r.namaPasien ?? '-'
        const poliAsal = r.nama_poli_asal ?? r.namaPoliAsal ?? '-'
        const poliTujuan = r.nama_poli_tujuan ?? r.namaPoliTujuan ?? '-'
        const diagnosa = r.diagnosis_sementara ?? r.diagnosisSementara ?? '-'
        const cat = r.catatan ?? '-'
        const namaDokter = r.nama_dokter ?? r.namaDokter ?? (user.full_name || '-')
        return `<tr><td>${date}</td><td>${escapeHtml(namaPasien)}</td><td>${escapeHtml(poliAsal)}</td><td>${escapeHtml(poliTujuan)}</td><td>${escapeHtml(diagnosa)}</td><td>${escapeHtml(cat)}</td><td>${escapeHtml(namaDokter)}</td></tr>`
      }).join('')

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${styles}</style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr><th>Tanggal</th><th>Nama Pasien</th><th>Poli Asal</th><th>Poli Tujuan</th><th>Diagnosis Sementara</th><th>Catatan</th><th>Nama Dokter</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();setTimeout(()=>window.close(),500);};</script></body></html>`

      const w = window.open('', '_blank')
      if (!w) { alert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.'); return }
      w.document.open()
      w.document.write(html)
      w.document.close()
    } catch (e) {
      console.error('Error printing rujukan', e)
      alert('Gagal memproses cetak rujukan: ' + (e && e.message ? e.message : String(e)))
    }
  }

  const isoToLocalDateTime = (iso) => {
    try {
      const d = new Date(iso)
      const pad = (n) => String(n).padStart(2, '0')
      const y = d.getFullYear()
      const m = pad(d.getMonth() + 1)
      const day = pad(d.getDate())
      const hh = pad(d.getHours())
      const mm = pad(d.getMinutes())
      return `${y}-${m}-${day}T${hh}:${mm}`
    } catch (e) { return '' }
  }

  const localToIso = (local) => {
    try {
      // local is like 'YYYY-MM-DDTHH:mm'
      const d = new Date(local)
      return d.toISOString()
    } catch (e) { return new Date().toISOString() }
  }

  useEffect(() => {
    // load lab history and ekg history for the current doctor
    const loadLabHistory = async () => {
      if (!myDokterId) return
      setLoadingLabHistory(true)
      setLabHistoryError('')
      try {
        const res = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal memuat riwayat pemeriksaan')
        const data = await res.json()
        setLabHistory(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed loading lab history', e)
        setLabHistoryError(String(e.message || e))
        setLabHistory([])
      } finally {
        setLoadingLabHistory(false)
      }
    }

    const loadEkgHistory = async () => {
      if (!myDokterId) return
      setLoadingEkgHistory(true)
      setEkgHistoryError('')
      try {
        const res = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal memuat riwayat EKG')
        const data = await res.json()
        setEkgHistory(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed loading EKG history', e)
        setEkgHistoryError(String(e.message || e))
        setEkgHistory([])
      } finally {
        setLoadingEkgHistory(false)
      }
    }

    loadLabHistory()
    loadEkgHistory()
  }, [myDokterId])

  // when rujukan tab is selected, fetch rujukan history for current patient
  useEffect(() => {
    if (selectedTab === 'rujukan') {
      try {
        const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? (antrian ? (antrian[0]?.idPasien ?? antrian[0]?.id) : null)
        if (pid) fetchRujukanHistory(pid).catch(() => {})
      } catch (e) { /* ignore */ }
    }
  }, [selectedTab, selectedPatient, antrian])

  // load diagnosis history for the currently selected patient (fallback to antrian[0])
  useEffect(() => {
    const loadDiagnosis = async () => {
      const pid = selectedPatient?.id ?? selectedPatient?.idPasien ?? selectedPatient?.id_pasien ?? selectedPatient?.pasien_id ?? (antrian && antrian.length > 0 ? (antrian[0]?.idPasien ?? antrian[0]?.id) : null)
      if (!pid) {
        setDiagnosisHistory([])
        return
      }
      setLoadingDiagnosisHistory(true)
      setDiagnosisHistoryError('')
      try {
        const diagnosisUrl = `${API_BASE_URL}/diagnosis?idPasien=${encodeURIComponent(pid)}`
        console.debug('loadDiagnosis -> fetching', { diagnosisUrl, API_BASE_URL })
        const res = await fetch(diagnosisUrl, { credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'follow' })
        if (!res || !res.ok) throw new Error('Gagal memuat riwayat catatan diagnosis')
        const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
        if (!contentType.includes('application/json')) {
          const text = await res.text().catch(() => '')
          const short = (text || '').slice(0, 400)
          throw new Error(`Unexpected response (not JSON): ${short}`)
        }
        const data = await res.json()
        setDiagnosisHistory(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed loading diagnosis history', e)
        setDiagnosisHistoryError(String(e.message || e))
        setDiagnosisHistory([])
      } finally {
        setLoadingDiagnosisHistory(false)
      }
    }
    loadDiagnosis()
  }, [selectedPatient, antrian])

  // load ICD list (backend)
  useEffect(() => {
    const loadIcd = async () => {
      setLoadingIcd(true)
      setIcdError('')
      try {
        const res = await fetch(`${API_BASE_URL}/icd10/`)
        if (!res.ok) throw new Error('Gagal memuat ICD-10')
        const data = await res.json()
        const items = Array.isArray(data) ? data.map(i => ({ kode: i.Kode || i.Kode || i.kode || i.Kode, nama: i.Nama || i.nama || '' })) : []
        setIcdList(items)
      } catch (e) {
        console.error('Failed loading icd', e)
        setIcdList([])
        setIcdError(String(e.message || e))
      } finally {
        setLoadingIcd(false)
      }
    }
    loadIcd()
  }, [])

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
              <span className="sidebar-icon">∿</span>
              <span>Poli Penyakit Dalam</span>
            </span>
            <span className="sidebar-chevron">›</span>
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
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleSelectPatient(it)}
                    onMouseEnter={() => {
                      if (hoverTimer.current) clearTimeout(hoverTimer.current)
                      const pid = it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id
                      hoverTimer.current = setTimeout(() => { setHoveredPatientId(pid) }, 250)
                    }}
                    onMouseLeave={() => {
                      if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
                      setHoveredPatientId(null)
                    }}
                    style={{ background: isActive ? '#dbeafe' : '#e6f6ff', color: '#0369a1', padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >{it.namaPasien}</button>
                )
              })
            )}
            {/* Confirmation modal for delete */}
            {confirmVisible && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
                <div style={{ width: 420, background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>{confirmTitle || 'Peringatan'}</h3>
                  <div style={{ padding: '10px 0', color: '#374151' }}>{confirmMessage}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={handleConfirmNo} style={{ background: '#e5e7eb', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                    <button type="button" onClick={handleConfirmYes} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>{antrianError || ''}</div>
        </div>

        {/* Daftar Pemeriksaan: tabs sementara */}
        <div style={{ padding: '12px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setSelectedTab('anamnesis')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'anamnesis' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'anamnesis' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'anamnesis' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Pemeriksaan Laboratorium</button>
            <button type="button" onClick={() => setSelectedTab('vital')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'vital' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'vital' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'vital' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Pemeriksaan EKG</button>
            <button type="button" onClick={() => setSelectedTab('diagnosis')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'diagnosis' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'diagnosis' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'diagnosis' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Catatan Diagnosis</button>
            <button type="button" onClick={() => setSelectedTab('rujukan')} style={{ padding: '8px 14px', borderRadius: 999, border: selectedTab === 'rujukan' ? '1px solid #60a5fa' : '1px solid #e6eef8', background: selectedTab === 'rujukan' ? '#e6f2ff' : '#ffffff', color: selectedTab === 'rujukan' ? '#0b57d0' : '#374151', cursor: 'pointer' }}>Rujukan Ulang</button>
            <button type="button" onClick={handleMarkSelesai} disabled={isMarkingSelesai} style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid #e6eef8', background: isMarkingSelesai ? '#94a3b8' : '#10b981', color: '#fff', cursor: 'pointer' }}>{isMarkingSelesai ? 'Memproses...' : 'Selesai'}</button>
          </div>
          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)' }}>
            {selectedTab === 'anamnesis' && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                  <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                    <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', alignItems: 'start', lineHeight: '1.25' }}>
                        <div style={{ opacity: 0.9 }}>Tgl Masuk</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tanggalMasuk || antrian[0]?.tanggalMasuk || antrian[0]?.tanggal_masuk || '-'}</div>
                        <div style={{ opacity: 0.9 }}>NIK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nik || antrian[0]?.nik || antrian[0]?.nomorKartu || '-'}</div>
                        <div style={{ opacity: 0.9 }}>JK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.jenisKelamin || selectedPatient?.jk || antrian[0]?.jenisKelamin || antrian[0]?.jk || antrian[0]?.jenis_kelamin || '-'}</div>
                        <div style={{ opacity: 0.9 }}>TTL</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tempatTanggalLahir || selectedPatient?.tempatLahir || selectedPatient?.ttl || antrian[0]?.tempatTanggalLahir || antrian[0]?.tempatLahir || antrian[0]?.ttl || '-'}</div>
                        <div style={{ opacity: 0.9 }}>No. Telp</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || antrian[0]?.nomorTelepon || antrian[0]?.telepon || antrian[0]?.noTelp || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Alamat</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.alamat || antrian[0]?.alamat || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Kategori</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.kategori || antrian[0]?.kategori || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Pekerjaan</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.pekerjaan || antrian[0]?.pekerjaan || '-'}</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Pemeriksaan Laboratorium</h3>
                  <form onSubmit={handleSubmitLab} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* lab inputs (unchanged) */}
                    <div>
                      <label>HB</label>
                      <input name="hb" value={labForm.hb} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>HT</label>
                      <input name="ht" value={labForm.ht} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Leukosit</label>
                      <input name="leukosit" value={labForm.leukosit} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Trombosit</label>
                      <input name="trombosit" value={labForm.trombosit} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Gula Puasa</label>
                      <input name="gulaPuasa" value={labForm.gulaPuasa} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Gula Sewaktu</label>
                      <input name="gulaSewaktu" value={labForm.gulaSewaktu} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>HbA1c</label>
                      <input name="hba1c" value={labForm.hba1c} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Kolesterol Total</label>
                      <input name="kolesterolTotal" value={labForm.kolesterolTotal} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>HDL</label>
                      <input name="hdl" value={labForm.hdl} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>LDL</label>
                      <input name="ldl" value={labForm.ldl} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Trigliserida</label>
                      <input name="trigliserida" value={labForm.trigliserida} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>SGOT</label>
                      <input name="sgot" value={labForm.sgot} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>SGPT</label>
                      <input name="sgpt" value={labForm.sgpt} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Ureum</label>
                      <input name="ureum" value={labForm.ureum} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Kreatinin</label>
                      <input name="kreatinin" value={labForm.kreatinin} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Asam Urat</label>
                      <input name="asamUrat" value={labForm.asamUrat} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Natrium</label>
                      <input name="natrium" value={labForm.natrium} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Kalium</label>
                      <input name="kalium" value={labForm.kalium} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Klorida</label>
                      <input name="klorida" value={labForm.klorida} onChange={handleLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <button type="submit" disabled={labSubmitting} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{labSubmitting ? 'Menyimpan...' : 'Simpan Pemeriksaan'}</button>
                      {labMessage && <div style={{ color: '#15803d' }}>{labMessage}</div>}
                      {labError && <div style={{ color: '#b91c1c' }}>{labError}</div>}
                    </div>
                  </form>
                  {/* history moved outside column to allow full-width table */}
                </div>
              </div>
            )}
            {selectedTab === 'vital' && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                  <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                    <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Tgl Masuk</div><div>{selectedPatient?.tanggalMasuk || antrian[0]?.tanggalMasuk || antrian[0]?.tanggal_masuk || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>NIK</div><div>{selectedPatient?.nik || antrian[0]?.nik || antrian[0]?.nomorKartu || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>JK</div><div>{selectedPatient?.jenisKelamin || selectedPatient?.jk || antrian[0]?.jenisKelamin || antrian[0]?.jk || antrian[0]?.jenis_kelamin || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>TTL</div><div>{selectedPatient?.tempatTanggalLahir || selectedPatient?.tempatLahir || selectedPatient?.ttl || antrian[0]?.tempatTanggalLahir || antrian[0]?.tempatLahir || antrian[0]?.ttl || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>No. Telp</div><div>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || antrian[0]?.nomorTelepon || antrian[0]?.telepon || antrian[0]?.noTelp || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Alamat</div><div>{selectedPatient?.alamat || antrian[0]?.alamat || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Kategori</div><div>{selectedPatient?.kategori || antrian[0]?.kategori || '-'}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Pekerjaan</div><div>{selectedPatient?.pekerjaan || antrian[0]?.pekerjaan || '-'}</div></div>
                    </div>

                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Pemeriksaan EKG</h3>
                  <form onSubmit={handleSubmitEkg} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label>Detak Jantung (bpm)</label>
                      <input name="detakJantung" value={ekgForm.detakJantung} onChange={handleEkgChange} type="number" step="1" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Irama</label>
                      <input name="irama" value={ekgForm.irama} onChange={handleEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>PR Interval (s)</label>
                      <input name="prInterval" value={ekgForm.prInterval} onChange={handleEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>QRS Duration (s)</label>
                      <input name="qrsDuration" value={ekgForm.qrsDuration} onChange={handleEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>QT/QTC Interval (s)</label>
                      <input name="qt_qtc_interval" value={ekgForm.qt_qtc_interval} onChange={handleEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>Axis Jantung</label>
                      <input name="axisJantung" value={ekgForm.axisJantung} onChange={handleEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>ST Elevation/Depression</label>
                      <input name="st_elevation_depression" value={ekgForm.st_elevation_depression} onChange={handleEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div>
                      <label>T-wave Abnormality</label>
                      <input name="t_wave_abnormality" value={ekgForm.t_wave_abnormality} onChange={handleEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>Interpretasi Dokter</label>
                      <textarea name="interpretasi_dokter" value={ekgForm.interpretasi_dokter} onChange={handleEkgChange} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <button type="submit" disabled={ekgSubmitting} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{ekgSubmitting ? 'Menyimpan...' : 'Simpan EKG'}</button>
                      {ekgMessage && <div style={{ color: '#15803d' }}>{ekgMessage}</div>}
                      {ekgError && <div style={{ color: '#b91c1c' }}>{ekgError}</div>}
                    </div>
                  </form>
                </div>
              </div>
            )}
            {selectedTab === 'rujukan' && (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                  <div style={{ width: 360 }}>
                    <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                      <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || '-'}</div>

                      <div style={{ marginTop: 12, fontSize: 13 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', alignItems: 'start', lineHeight: '1.25' }}>
                          <div style={{ opacity: 0.9 }}>Tgl Masuk</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tanggalMasuk || antrian[0]?.tanggalMasuk || antrian[0]?.tanggal_masuk || '-'}</div>
                          <div style={{ opacity: 0.9 }}>NIK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nik || antrian[0]?.nik || antrian[0]?.nomorKartu || '-'}</div>
                          <div style={{ opacity: 0.9 }}>JK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.jenisKelamin || selectedPatient?.jk || antrian[0]?.jenisKelamin || antrian[0]?.jk || antrian[0]?.jenis_kelamin || '-'}</div>
                          <div style={{ opacity: 0.9 }}>TTL</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tempatTanggalLahir || selectedPatient?.tempatLahir || selectedPatient?.ttl || antrian[0]?.tempatTanggalLahir || antrian[0]?.tempatLahir || antrian[0]?.ttl || '-'}</div>
                          <div style={{ opacity: 0.9 }}>No. Telp</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || antrian[0]?.nomorTelepon || antrian[0]?.telepon || antrian[0]?.noTelp || '-'}</div>
                          <div style={{ opacity: 0.9 }}>Alamat</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.alamat || antrian[0]?.alamat || '-'}</div>
                          <div style={{ opacity: 0.9 }}>Kategori</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.kategori || antrian[0]?.kategori || '-'}</div>
                          <div style={{ opacity: 0.9 }}>Pekerjaan</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.pekerjaan || antrian[0]?.pekerjaan || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

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
                              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatToDateTime(r.date_make ?? r.dateMake)}</td>
                              <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_poli_tujuan ?? r.namaPoliTujuan ?? '-'}</td>
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
            {selectedTab === 'diagnosis' && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                  <div style={{ background: 'linear-gradient(180deg,#0f766e 0%, #047857 100%)', color: '#fff', borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPatient ? (selectedPatient.namaPasien || selectedPatient.full_name || selectedPatient.nama || '') : (antrian[0]?.namaPasien || '')}</div>
                    <div style={{ opacity: 0.9, marginTop: 8 }}>{selectedPatient?.poliklinik || selectedPatient?.poli || antrian[0]?.poliklinik || antrian[0]?.poli || '-'}</div>

                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', alignItems: 'start', lineHeight: '1.25' }}>
                        <div style={{ opacity: 0.9 }}>Tgl Masuk</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tanggalMasuk || antrian[0]?.tanggalMasuk || antrian[0]?.tanggal_masuk || '-'}</div>
                        <div style={{ opacity: 0.9 }}>NIK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nik || antrian[0]?.nik || antrian[0]?.nomorKartu || '-'}</div>
                        <div style={{ opacity: 0.9 }}>JK</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.jenisKelamin || selectedPatient?.jk || antrian[0]?.jenisKelamin || antrian[0]?.jk || antrian[0]?.jenis_kelamin || '-'}</div>
                        <div style={{ opacity: 0.9 }}>TTL</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.tempatTanggalLahir || selectedPatient?.tempatLahir || selectedPatient?.ttl || antrian[0]?.tempatTanggalLahir || antrian[0]?.tempatLahir || antrian[0]?.ttl || '-'}</div>
                        <div style={{ opacity: 0.9 }}>No. Telp</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.nomorTelepon || selectedPatient?.telepon || selectedPatient?.noTelp || antrian[0]?.nomorTelepon || antrian[0]?.telepon || antrian[0]?.noTelp || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Alamat</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.alamat || antrian[0]?.alamat || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Kategori</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.kategori || antrian[0]?.kategori || '-'}</div>
                        <div style={{ opacity: 0.9 }}>Pekerjaan</div><div style={{ overflowWrap: 'anywhere' }}>{selectedPatient?.pekerjaan || antrian[0]?.pekerjaan || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Catatan Diagnosis</h3>
                  <form onSubmit={handleSubmitDiagnosis} style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label>Tanggal</label>
                        <input type="datetime-local" value={isoToLocalDateTime(diagnosisForm.tanggal)} onChange={(e) => handleDiagnosisChange('tanggal', localToIso(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label>Status</label>
                        <select value={diagnosisForm.status} onChange={(e) => handleDiagnosisChange('status', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                          <option value="Terkonfirmasi">Terkonfirmasi</option>
                          <option value="Suspect">Suspect</option>
                          <option value="Kemungkinan">Kemungkinan</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label>Diagnosis Utama (ICD-10)</label>
                      {loadingIcd ? <div>Memuat ICD...</div> : icdError ? <div style={{ color: '#b91c1c' }}>{icdError}</div> : (
                        <select value={diagnosisForm.diagnosis_utama} onChange={(e) => handleDiagnosisChange('diagnosis_utama', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                          <option value="">-- Pilih ICD --</option>
                          {icdList.map(i => (<option key={i.kode} value={i.kode}>{i.kode} - {i.nama}</option>))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label>Diagnosis Sekunder</label>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {diagnosisForm.diagnosis_sekunder.map((val, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 8 }}>
                            <select value={val} onChange={(e) => setSecondary(idx, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                              <option value="">-- Pilih ICD --</option>
                              {icdList.map(i => (<option key={i.kode} value={i.kode}>{i.kode} - {i.nama}</option>))}
                            </select>
                            <button type="button" onClick={() => removeSecondary(idx)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
                          </div>
                        ))}
                        <button type="button" onClick={addSecondary} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', width: 160 }}>Tambah Sekunder</button>
                      </div>
                    </div>

                    <div>
                      <label>Diagnosis Banding</label>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {diagnosisForm.diagnosis_banding.map((v, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8 }}>
                            <input value={v} onChange={(e) => setBanding(i, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                            <button type="button" onClick={() => removeBanding(i)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
                          </div>
                        ))}
                        <button type="button" onClick={addBanding} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', width: 160 }}>Tambah Banding</button>
                      </div>
                    </div>

                    <div>
                      <label>Dasar Diagnosis</label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                        {['Anamnesis', 'Pemeriksaan Fisik', 'Laboratorium'].map(d => (
                          <label key={d} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="checkbox" checked={diagnosisForm.dasar_diagnosis.includes(d)} onChange={() => toggleDasar(d)} /> <span>{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label>Catatan</label>
                      <textarea value={diagnosisForm.catatan} onChange={(e) => handleDiagnosisChange('catatan', e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button type="submit" disabled={diagnosisSubmitting} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{diagnosisSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}</button>
                      {diagnosisMessage && <div style={{ color: '#15803d' }}>{diagnosisMessage}</div>}
                      {diagnosisError && <div style={{ color: '#b91c1c' }}>{diagnosisError}</div>}
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Riwayat Catatan Diagnosis - tampilkan setelah form */}
            {selectedTab === 'diagnosis' && (
              <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)', marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Riwayat Catatan Diagnosis</h3>
                {loadingDiagnosisHistory ? (
                  <div>Memuat riwayat catatan diagnosis...</div>
                ) : diagnosisHistoryError ? (
                  <div style={{ color: '#b91c1c' }}>{diagnosisHistoryError}</div>
                ) : (!diagnosisHistory || diagnosisHistory.length === 0) ? (
                  <div>Tidak ada riwayat catatan diagnosis.</div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000, whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                          <th style={{ padding: '10px 8px' }}>Aksi</th>
                          <th style={{ padding: '10px 8px' }}>Tanggal</th>
                          <th style={{ padding: '10px 8px' }}>Diagnosa Utama</th>
                          <th style={{ padding: '10px 8px' }}>Diagnosa Sekunder</th>
                          <th style={{ padding: '10px 8px' }}>Diagnosis Banding</th>
                          <th style={{ padding: '10px 8px' }}>Dasar Diagnosis</th>
                          <th style={{ padding: '10px 8px' }}>Catatan</th>
                          <th style={{ padding: '10px 8px' }}>Dokter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosisHistory.map((d) => (
                          <tr key={d.id || d.id_diagnosis} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                <button type="button" onClick={() => handleOpenDiagnosisEdit(d)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideDiagnosis(d) })} disabled={isHidingDiagnosisId === (d.id || d.id_diagnosis)} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingDiagnosisId === (d.id || d.id_diagnosis) ? 'Menghapus...' : 'HAPUS'}</button>
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px' }}>{formatToDateTime(d.tanggal ?? d.waktu ?? d.createdAt)}</td>
                            <td style={{ padding: '10px 8px' }}>{(d.diagnosis_utama && (d.diagnosis_utama.nama || d.diagnosis_utama.kode_icd)) ? (d.diagnosis_utama.nama || d.diagnosis_utama.kode_icd) : (d.diagnosa || '-')}</td>
                            <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                              {Array.isArray(d.diagnosis_sekunder) && d.diagnosis_sekunder.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {d.diagnosis_sekunder.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ width: 8, height: 8, background: '#111', borderRadius: '50%', display: 'inline-block' }} />
                                      <span>{s && (s.nama || s.kode_icd) ? (s.nama || s.kode_icd) : String(s)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (d.diagnosis_sekunder ? String(d.diagnosis_sekunder) : '-')}
                            </td>
                            <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                              {Array.isArray(d.diagnosis_banding) && d.diagnosis_banding.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {d.diagnosis_banding.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ width: 8, height: 8, background: '#111', borderRadius: '50%', display: 'inline-block' }} />
                                      <span>{String(b)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (d.diagnosis_banding ? String(d.diagnosis_banding) : '-')}
                            </td>
                            <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                              {Array.isArray(d.dasar_diagnosis) && d.dasar_diagnosis.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {d.dasar_diagnosis.map((x, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ width: 8, height: 8, background: '#111', borderRadius: '50%', display: 'inline-block' }} />
                                      <span>{String(x)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (d.dasar_diagnosis ? String(d.dasar_diagnosis) : '-')}
                            </td>
                            <td style={{ padding: '10px 8px' }}>{d.catatan ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{d.namaDokter ?? d.nama_dokter ?? d.dokterNama ?? (d.id_dokter ? String(d.id_dokter) : '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {isEditingLabId && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                <div style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Ubah</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>HB</label>
                        <input name="hb" value={editLabForm.hb} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>HT</label>
                        <input name="ht" value={editLabForm.ht} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Leukosit</label>
                        <input name="leukosit" value={editLabForm.leukosit} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Trombosit</label>
                        <input name="trombosit" value={editLabForm.trombosit} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Gula Puasa</label>
                        <input name="gulaPuasa" value={editLabForm.gulaPuasa} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Gula Sewaktu</label>
                        <input name="gulaSewaktu" value={editLabForm.gulaSewaktu} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>HbA1c</label>
                        <input name="hba1c" value={editLabForm.hba1c} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Kolesterol Total</label>
                        <input name="kolesterolTotal" value={editLabForm.kolesterolTotal} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>HDL</label>
                        <input name="hdl" value={editLabForm.hdl} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>LDL</label>
                        <input name="ldl" value={editLabForm.ldl} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Trigliserida</label>
                        <input name="trigliserida" value={editLabForm.trigliserida} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>SGOT</label>
                        <input name="sgot" value={editLabForm.sgot} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>SGPT</label>
                        <input name="sgpt" value={editLabForm.sgpt} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Ureum</label>
                        <input name="ureum" value={editLabForm.ureum} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Kreatinin</label>
                        <input name="kreatinin" value={editLabForm.kreatinin} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Asam Urat</label>
                        <input name="asamUrat" value={editLabForm.asamUrat} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Natrium</label>
                        <input name="natrium" value={editLabForm.natrium} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Kalium</label>
                        <input name="kalium" value={editLabForm.kalium} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Klorida</label>
                        <input name="klorida" value={editLabForm.klorida} onChange={handleEditLabChange} type="number" step="any" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={handleSubmitLabEdit} disabled={isSubmittingLabEdit} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingLabEdit ? 'Menyimpan...' : 'Simpan'}</button>
                      <button onClick={() => setIsEditingLabId(null)} disabled={isSubmittingLabEdit} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                    </div>
                    <div style={{ color: labEditMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{labEditMessage}</div>
                  </div>
                </div>
                </div>
              )}
              {isEditingEkgId && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                  <div style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Ubah EKG</h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Detak Jantung (bpm)</label>
                          <input name="detakJantung" value={editEkgForm.detakJantung} onChange={handleEditEkgChange} type="number" step="1" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Irama</label>
                          <input name="irama" value={editEkgForm.irama} onChange={handleEditEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>PR Interval (s)</label>
                          <input name="prInterval" value={editEkgForm.prInterval} onChange={handleEditEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>QRS Duration (s)</label>
                          <input name="qrsDuration" value={editEkgForm.qrsDuration} onChange={handleEditEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>QT/QTC Interval (s)</label>
                          <input name="qt_qtc_interval" value={editEkgForm.qt_qtc_interval} onChange={handleEditEkgChange} type="number" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Axis Jantung</label>
                          <input name="axisJantung" value={editEkgForm.axisJantung} onChange={handleEditEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>ST Elevation/Depression</label>
                          <input name="st_elevation_depression" value={editEkgForm.st_elevation_depression} onChange={handleEditEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>T-wave Abnormality</label>
                          <input name="t_wave_abnormality" value={editEkgForm.t_wave_abnormality} onChange={handleEditEkgChange} type="text" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Interpretasi Dokter</label>
                          <textarea name="interpretasi_dokter" value={editEkgForm.interpretasi_dokter} onChange={handleEditEkgChange} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleSubmitEkgEdit} disabled={isSubmittingEkgEdit} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingEkgEdit ? 'Menyimpan...' : 'Simpan'}</button>
                        <button onClick={() => setIsEditingEkgId(null)} disabled={isSubmittingEkgEdit} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                      </div>
                      <div style={{ color: ekgEditMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{ekgEditMessage}</div>
                    </div>
                  </div>
                </div>
              )}
              {isEditingDiagnosisId && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                  <div style={{ width: 760, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Ubah Catatan Diagnosis</h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tanggal</label>
                          <input type="datetime-local" value={isoToLocalDateTime(editDiagnosisForm.tanggal)} onChange={(e) => handleEditDiagnosisChange('tanggal', localToIso(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Status</label>
                          <select value={editDiagnosisForm.status} onChange={(e) => handleEditDiagnosisChange('status', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                            <option value="Terkonfirmasi">Terkonfirmasi</option>
                            <option value="Suspect">Suspect</option>
                            <option value="Kemungkinan">Kemungkinan</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Diagnosis Utama (ICD-10)</label>
                        {loadingIcd ? <div>Memuat ICD...</div> : icdError ? <div style={{ color: '#b91c1c' }}>{icdError}</div> : (
                          <select value={editDiagnosisForm.diagnosis_utama} onChange={(e) => handleEditDiagnosisChange('diagnosis_utama', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                            <option value="">-- Pilih ICD --</option>
                            {icdList.map(i => (<option key={i.kode} value={i.kode}>{i.kode} - {i.nama}</option>))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Diagnosis Sekunder</label>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {editDiagnosisForm.diagnosis_sekunder.map((val, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8 }}>
                              <select value={val} onChange={(e) => {
                                const v = e.target.value
                                setEditDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: prev.diagnosis_sekunder.map((p,i) => i===idx ? v : p) }))
                              }} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }}>
                                <option value="">-- Pilih ICD --</option>
                                {icdList.map(i => (<option key={i.kode} value={i.kode}>{i.kode} - {i.nama}</option>))}
                              </select>
                              <button type="button" onClick={() => setEditDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: prev.diagnosis_sekunder.filter((_,i) => i !== idx) }))} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setEditDiagnosisForm(prev => ({ ...prev, diagnosis_sekunder: [...prev.diagnosis_sekunder, ''] }))} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', width: 160 }}>Tambah Sekunder</button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Diagnosis Banding</label>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {editDiagnosisForm.diagnosis_banding.map((v, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8 }}>
                              <input value={v} onChange={(e) => setEditDiagnosisForm(prev => ({ ...prev, diagnosis_banding: prev.diagnosis_banding.map((p,idx) => idx===i ? e.target.value : p) }))} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                              <button type="button" onClick={() => setEditDiagnosisForm(prev => ({ ...prev, diagnosis_banding: prev.diagnosis_banding.filter((_,ii) => ii !== i) }))} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}>Hapus</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setEditDiagnosisForm(prev => ({ ...prev, diagnosis_banding: [...prev.diagnosis_banding, ''] }))} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', width: 160 }}>Tambah Banding</button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Dasar Diagnosis</label>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                          {['Anamnesis', 'Pemeriksaan Fisik', 'Laboratorium'].map(d => (
                            <label key={d} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input type="checkbox" checked={editDiagnosisForm.dasar_diagnosis.includes(d)} onChange={() => setEditDiagnosisForm(prev => ({ ...prev, dasar_diagnosis: prev.dasar_diagnosis.includes(d) ? prev.dasar_diagnosis.filter(x => x !== d) : [...prev.dasar_diagnosis, d] }))} /> <span>{d}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Catatan</label>
                        <textarea value={editDiagnosisForm.catatan} onChange={(e) => handleEditDiagnosisChange('catatan', e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eef8' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button onClick={handleSubmitDiagnosisEdit} disabled={isSubmittingDiagnosisEdit} style={{ background: '#0ea5a4', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>{isSubmittingDiagnosisEdit ? 'Menyimpan...' : 'Simpan'}</button>
                        <button onClick={() => setIsEditingDiagnosisId(null)} disabled={isSubmittingDiagnosisEdit} style={{ background: '#e6e6e6', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Batal</button>
                      </div>
                      <div style={{ color: diagnosisEditMessage?.startsWith('Gagal') ? '#b91c1c' : '#0b995b' }}>{diagnosisEditMessage}</div>
                    </div>
                  </div>
                </div>
              )}
              {selectedTab === 'anamnesis' && (
              <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)', marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Riwayat Pemeriksaan Laboratorium</h3>
                {loadingLabHistory ? (
                  <div>Memuat riwayat...</div>
                ) : labHistoryError ? (
                  <div style={{ color: '#b91c1c' }}>{labHistoryError}</div>
                ) : (!labHistory || labHistory.length === 0) ? (
                  <div>Tidak ada riwayat pemeriksaan.</div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 2000, whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                          <th style={{ padding: '10px 8px' }}>Aksi</th>
                          <th style={{ padding: '10px 8px' }}>Tanggal</th>
                          <th style={{ padding: '10px 8px' }}>HB</th>
                          <th style={{ padding: '10px 8px' }}>HT</th>
                          <th style={{ padding: '10px 8px' }}>Leukosit</th>
                          <th style={{ padding: '10px 8px' }}>Trombosit</th>
                          <th style={{ padding: '10px 8px' }}>Gula Puasa</th>
                          <th style={{ padding: '10px 8px' }}>Gula Sewaktu</th>
                          <th style={{ padding: '10px 8px' }}>HBA1c</th>
                          <th style={{ padding: '10px 8px' }}>Kolesterol Total</th>
                          <th style={{ padding: '10px 8px' }}>HDL</th>
                          <th style={{ padding: '10px 8px' }}>LDL</th>
                          <th style={{ padding: '10px 8px' }}>Trigliserida</th>
                          <th style={{ padding: '10px 8px' }}>SGOT</th>
                          <th style={{ padding: '10px 8px' }}>SGPT</th>
                          <th style={{ padding: '10px 8px' }}>Ureum</th>
                          <th style={{ padding: '10px 8px' }}>Kreatinin</th>
                          <th style={{ padding: '10px 8px' }}>Asam Urat</th>
                          <th style={{ padding: '10px 8px' }}>Natrium</th>
                          <th style={{ padding: '10px 8px' }}>Kalium</th>
                          <th style={{ padding: '10px 8px' }}>Klorida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labHistory.map((h) => (
                          <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                <button type="button" onClick={() => handleOpenLabEdit(h)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideLab(h) })} disabled={isHidingLabId === h.id} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingLabId === h.id ? 'Menghapus...' : 'HAPUS'}</button>
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px' }}>{formatToDateTime(h.waktu ?? h.waktu)}</td>
                            <td style={{ padding: '10px 8px' }}>{h.hb ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.ht ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.leukosit ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.trombosit ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.gulaPuasa ?? h.gula_puasa ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.gulaSewaktu ?? h.gula_sewaktu ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.hba1c ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.kolesterolTotal ?? h.kolesterol_total ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.hdl ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.ldl ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.trigliserida ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.sgot ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.sgpt ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.ureum ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.kreatinin ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.asamUrat ?? h.asam_urat ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.natrium ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.kalium ?? '-'}</td>
                            <td style={{ padding: '10px 8px' }}>{h.klorida ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {selectedTab === 'vital' && (
              <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(15,23,42,0.03)', marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Riwayat Pemeriksaan EKG</h3>
                {loadingEkgHistory ? (
                  <div>Memuat riwayat EKG...</div>
                ) : ekgHistoryError ? (
                  <div style={{ color: '#b91c1c' }}>{ekgHistoryError}</div>
                ) : (!ekgHistory || ekgHistory.length === 0) ? (
                  <div>Tidak ada riwayat pemeriksaan EKG.</div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100, whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                            <th style={{ padding: '10px 8px' }}>Aksi</th>
                            <th style={{ padding: '10px 8px' }}>Tanggal</th>
                            <th style={{ padding: '10px 8px' }}>Detak Jantung</th>
                            <th style={{ padding: '10px 8px' }}>Irama</th>
                            <th style={{ padding: '10px 8px' }}>PR Interval</th>
                            <th style={{ padding: '10px 8px' }}>QRS Duration</th>
                            <th style={{ padding: '10px 8px' }}>QT/QTC</th>
                            <th style={{ padding: '10px 8px' }}>Axis Jantung</th>
                            <th style={{ padding: '10px 8px' }}>ST Elev/Dep</th>
                            <th style={{ padding: '10px 8px' }}>T-wave Abnormality</th>
                            <th style={{ padding: '10px 8px' }}>Interpretasi Dokter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ekgHistory.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                  <button type="button" onClick={() => handleOpenEkgEdit(r)} style={{ background: '#fef3c7', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>UBAH</button>
                                  <button type="button" onClick={() => showConfirm({ title: 'Peringatan', message: 'Apakah anda yakin ingin menghapus data ini?', onConfirm: () => handleHideEkg(r) })} disabled={isHidingEkgId === r.id} style={{ background: '#fee2e2', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>{isHidingEkgId === r.id ? 'Menghapus...' : 'HAPUS'}</button>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px' }}>{formatToDateTime(r.dateMake ?? r.date_make ?? r.waktu ?? r.createdAt)}</td>
                              <td style={{ padding: '10px 8px' }}>{r.detakJantung ?? r.detak_jantung ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.irama ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.prInterval ?? r.pr_interval ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.qrsDuration ?? r.qrs_duration ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.qt_qtc_interval ?? r.qt_qtc ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.axisJantung ?? r.axis_jantung ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.st_elevation_depression ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.t_wave_abnormality ?? '-'}</td>
                              <td style={{ padding: '10px 8px' }}>{r.interpretasi_dokter ?? r.interpretasiDokter ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PoliPenyakitDalam
