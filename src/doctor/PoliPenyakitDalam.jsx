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
  // confirmation modal state (for delete actions)
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
        headers: { 'Content-Type': 'application/json' },
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
        const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`)
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
        headers: { 'Content-Type': 'application/json' },
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
        const res2 = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`)
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
    const backendUrl = `http://localhost:8080/pemeriksaan_ekg/${encodeURIComponent(eid)}`
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
      const backendUrl = `http://localhost:8080/pemeriksaan_ekg/${encodeURIComponent(eid)}`
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
    const backendUrl = `http://localhost:8080/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
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
      const backendUrl = `http://localhost:8080/pemeriksaan_laboratorium/${encodeURIComponent(lid)}`
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

  useEffect(() => {
    const loadHistory = async () => {
      if (!myDokterId) return
      setLoadingLabHistory(true)
      setLabHistoryError('')
      try {
        const res = await fetch(`${API_BASE_URL}/pemeriksaan_laboratorium?idDokter=${encodeURIComponent(myDokterId)}`)
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
    loadHistory()
    // also load EKG history
    const loadEkg = async () => {
      if (!myDokterId) return
      setLoadingEkgHistory(true)
      setEkgHistoryError('')
      try {
        const res = await fetch(`${API_BASE_URL}/pemeriksaan_ekg?idDokter=${encodeURIComponent(myDokterId)}`)
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
    loadEkg()
  }, [myDokterId])

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
                  <h3 style={{ marginTop: 0 }}>Pemeriksaan Laboratorium</h3>
                  <form onSubmit={handleSubmitLab} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
