import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function FrontOfficeDashboard() {
  const navigate = useNavigate()
  const clinicId = 1

  // Form & UI state
  const [user, setUser] = useState({ full_name: 'Petugas Front Office', role_name: 'Front Office' })
  const [activeMenu, setActiveMenu] = useState('queue')
  const [form, setForm] = useState({
    namaPasien: '', tanggalMasuk: '', nik: '', jenisKelamin: 'Laki-laki', golonganDarah: 'O',
    tempatTanggalLahir: '', nomorTelepon: '', alamat: '', kategori: 'Umum', pekerjaan: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [patientListError, setPatientListError] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isRegisterMenu = activeMenu === 'register'

  // State & handler untuk fitur rujuk pasien ke poli
  const [showRujuk, setShowRujuk] = useState(null)
  const [poliList, setPoliList] = useState([])
  const [loadingPoli, setLoadingPoli] = useState(false)
  const [rujukError, setRujukError] = useState('')
  const [selectedPoli, setSelectedPoli] = useState('')
  const handleRujukClick = async (patientId) => {
    setShowRujuk(patientId)
    setLoadingPoli(true)
    setRujukError('')
    setSelectedPoli('')
    try {
      const res = await fetch(`${API_BASE_URL}/poli/?id_data_klinik=${clinicId}`)
      if (!res.ok) throw new Error('Gagal mengambil data poli')
      const data = await res.json()
      setPoliList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setRujukError('Tidak dapat memuat daftar poli')
      setPoliList([])
    } finally {
      setLoadingPoli(false)
    }
  }

  const handleCancelRujuk = () => {
    setShowRujuk(null)
    setPoliList([])
    setSelectedPoli('')
    setRujukError('')
  }

  const handleSelectPoli = (e) => setSelectedPoli(e.target.value)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    // convert datetime-local (YYYY-MM-DDTHH:mm) -> "YYYY-MM-DD HH:mm:00"
    let tanggalMasuk = form.tanggalMasuk
    if (tanggalMasuk) {
      tanggalMasuk = tanggalMasuk.replace('T', ' ') + ':00'
    }

    try {
      const res = await fetch(`${API_BASE_URL}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          tanggalMasuk,
          idDataKlinik: clinicId,
        }),
      })

      if (!res.ok) {
        setError('Gagal menyimpan data pasien')
        return
      }

      setMessage('Data pasien berhasil disimpan')
      setForm((prev) => ({
        ...prev,
        namaPasien: '',
        tanggalMasuk: '',
        nik: '',
        tempatTanggalLahir: '',
        nomorTelepon: '',
        alamat: '',
        pekerjaan: '',
      }))

      try {
        const refreshed = await fetch(`${API_BASE_URL}/patients/?id_data_klinik=${clinicId}`)
        if (refreshed.ok) {
          const refreshedData = await refreshed.json()
          setPatients(Array.isArray(refreshedData) ? refreshedData : [])
        }
      } catch (refreshErr) {
        console.error(refreshErr)
      }
    } catch (err) {
      console.error(err)
      setError('Tidak dapat terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMenuClick = (key) => {
    setActiveMenu(key)
    setMessage('')
    setError('')
  }

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const today = now.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Active queue fetched from backend
  const [activeQueue, setActiveQueue] = useState([])
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [queueError, setQueueError] = useState('')
  // rujuk_ulang list for selected patient (front office view)
  const [rujukList, setRujukList] = useState([])
  const [loadingRujuk, setLoadingRujuk] = useState(false)
  const [rujukErrorMsg, setRujukErrorMsg] = useState('')
  const [rujukSubmitting, setRujukSubmitting] = useState({})
  const [rujukActionError, setRujukActionError] = useState({})

  // Doctors list for assigning
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorsError, setDoctorsError] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState({})
  const [assigning, setAssigning] = useState({})
  const [assignError, setAssignError] = useState({})
  const [doctorsByPoli, setDoctorsByPoli] = useState({})
  // Doctor picker modal state
  const [doctorPickerVisible, setDoctorPickerVisible] = useState(false)
  const [doctorPickerFor, setDoctorPickerFor] = useState(null)

  const poliNames = {
    1: 'Poli Umum',
    2: 'Poli Penyakit Dalam',
    3: 'Poli Bedah',
  }
  const getPoliName = (id) => poliNames[id] || '-'

  useEffect(() => {
    const loadQueue = async () => {
      setLoadingQueue(true)
      setQueueError('')
      try {
        const res = await fetch(`${API_BASE_URL}/antrian/`)
        if (!res.ok) throw new Error('Gagal mengambil antrian')
        const data = await res.json()
        // only keep items whose status === 1 (active)
        const items = Array.isArray(data) ? data.filter(it => Number(it.status) === 1) : []
        setActiveQueue(items)
      } catch (err) {
        console.error(err)
        setQueueError('Tidak dapat memuat antrian aktif')
      } finally {
        setLoadingQueue(false)
      }
    }

    loadQueue()
    // load patients list on mount
    loadPatients()
    // load doctors list once
    const loadDoctors = async () => {
      setLoadingDoctors(true)
      setDoctorsError('')
      try {
        const res = await fetch(`${API_BASE_URL}/dokter/`)
        if (!res.ok) throw new Error('Gagal mengambil daftar dokter')
        const data = await res.json()
        setDoctors(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setDoctorsError('Tidak dapat memuat daftar dokter')
        setDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }

    loadDoctors()
  }, [])

  // fetch rujuk_ulang for all patients (refresh when activeQueue changes)
  useEffect(() => {
    let cancelled = false
    const fetchRujukAll = async () => {
      setLoadingRujuk(true)
      setRujukErrorMsg('')
      try {
        const proxyUrls = [
          `${API_BASE_URL}/rujuk_ulang/`,
          `${API_BASE_URL}/rujuk_ulang`
        ]
        const backendUrls = [
          `http://localhost:8080/rujuk_ulang/`,
          `http://localhost:8080/rujuk_ulang`
        ]
        const urls = [...proxyUrls, ...backendUrls]
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
          setRujukList([])
          setRujukErrorMsg(String(lastErr || 'Gagal memuat rujukan'))
          return
        }
        const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : ''
        if (!contentType.includes('application/json')) {
          const txt = await res.text().catch(() => '')
          setRujukList([])
          setRujukErrorMsg(`Unexpected response: ${String(txt).slice(0,200)}`)
          return
        }
        const data = await res.json()
        if (!cancelled) setRujukList(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed loading rujuk_ulang', e)
        if (!cancelled) setRujukErrorMsg(String(e.message || e))
        if (!cancelled) setRujukList([])
      } finally {
        if (!cancelled) setLoadingRujuk(false)
      }
    }
    fetchRujukAll()
    return () => { cancelled = true }
  }, [activeQueue])

  const formatToJakarta = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (e) { return String(iso) }
  }

  const handleRujukFromHistory = async (r, idx) => {
    setRujukActionError(prev => ({ ...prev, [idx]: '' }))
    setRujukSubmitting(prev => ({ ...prev, [idx]: true }))
    try {
      const idPasien = r.idPasien ?? r.id_pasien ?? r.pasien_id ?? r.id ?? null
      const idPoli = r.poli_tujuan ?? r.poliTujuan ?? r.id_poli_tujuan ?? r.nama_poli_tujuan ?? null
      if (!idPasien || !idPoli) throw new Error('Data pasien atau poli tujuan tidak lengkap')

      const resp = await fetch(`${API_BASE_URL}/antrian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPasien: Number(idPasien), idPoli: Number(idPoli) }),
      })
      if (!resp.ok) {
        const t = await resp.text().catch(() => '')
        throw new Error(t || 'Gagal membuat antrian')
      }

      // refresh active queue
      try {
        const qres = await fetch(`${API_BASE_URL}/antrian/`)
        if (qres && qres.ok) {
          const data = await qres.json()
          const items = Array.isArray(data) ? data.filter(it => Number(it.status) === 1) : []
          setActiveQueue(items)
        }
      } catch (e) { console.error('Failed reload queue after rujuk', e) }
      // attempt to delete the rujuk_ulang record (if id available)
      const idRujuk = r.id_rujuk_ulang ?? r.idRujuk ?? r.id ?? null
      if (idRujuk) {
        try {
          const dresp = await fetch(`${API_BASE_URL}/rujuk_ulang/${idRujuk}`, { method: 'DELETE' })
          if (!dresp.ok) {
            const t = await dresp.text().catch(() => '')
            throw new Error(t || 'Gagal menghapus rujuk_ulang')
          }
          // remove from local list
          setRujukList(prev => (Array.isArray(prev) ? prev.filter(item => {
            const rid = item.id_rujuk_ulang ?? item.idRujuk ?? item.id ?? null
            return String(rid) !== String(idRujuk)
          }) : prev))
        } catch (e) {
          console.error('Failed deleting rujuk_ulang', e)
          setRujukActionError(prev => ({ ...prev, [idx]: `Hapus rujuk gagal: ${String(e.message || e)}` }))
        }
      }
    } catch (e) {
      console.error(e)
      setRujukActionError(prev => ({ ...prev, [idx]: String(e.message || e) }))
    } finally {
      setRujukSubmitting(prev => ({ ...prev, [idx]: false }))
    }
  }

  // load patients helper
  async function loadPatients() {
    setLoadingPatients(true)
    setPatientListError('')
    try {
      const res = await fetch(`${API_BASE_URL}/patients/?id_data_klinik=${clinicId}`)
      if (!res.ok) throw new Error('Gagal mengambil daftar pasien')
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setPatientListError('Tidak dapat memuat daftar pasien')
      setPatients([])
    } finally {
      setLoadingPatients(false)
    }
  }

  useEffect(() => {
    // for each unique poli id in the active queue, fetch doctors for that poli
    const poliIds = Array.from(new Set(activeQueue.map(i => i.idPoli ?? i.id_poli ?? i.poli_id ?? i.poli ?? i.poliId).filter(Boolean)))
    poliIds.forEach(async (pid) => {
      const key = String(pid)
      if (Object.prototype.hasOwnProperty.call(doctorsByPoli, key)) return
      // mark as loading
      setDoctorsByPoli(prev => ({ ...prev, [key]: null }))
      try {
        const res = await fetch(`${API_BASE_URL}/dokter/?idPoli=${encodeURIComponent(pid)}`)
        if (!res.ok) throw new Error('Gagal mengambil dokter untuk poli ' + pid)
        const data = await res.json()
        setDoctorsByPoli(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }))
      } catch (err) {
        console.error(err)
        setDoctorsByPoli(prev => ({ ...prev, [key]: [] }))
      }
    })
  }, [activeQueue])

  const isPatientInQueue = (patientId) => {
    if (!patientId) return false
    return activeQueue.some(q => {
      const qPid = q.idPasien ?? q.id_pasien ?? q.pasien_id ?? q.id_pasien ?? q.id ?? q.idPasien
      return String(qPid) === String(patientId)
    })
  }

  useEffect(() => {
    // debug: log doctors loaded for troubleshooting
    if (doctors && doctors.length > 0) {
      console.debug('Loaded doctors sample:', doctors.slice(0, 5))
    }
  }, [doctors])

  return (
    <div className="fo-dashboard">
      <aside className="fo-sidebar">
        <div className="fo-logo">Front Office</div>
        <nav className="fo-menu">
          <button
            className={activeMenu === 'queue' ? 'fo-menu-item active' : 'fo-menu-item'}
            type="button"
            onClick={() => handleMenuClick('queue')}
          >
            Dashboard Admin
          </button>
          <button
            className={activeMenu === 'register' ? 'fo-menu-item active' : 'fo-menu-item'}
            type="button"
            onClick={() => handleMenuClick('register')}
          >
            Registrasi Pasien
          </button>
        </nav>
      </aside>

      <main className={isRegisterMenu ? 'fo-main fo-main-register' : 'fo-main'}>
        <header className="fo-header">
          <div>
            <h1 className="fo-title">Dashboard Front Office</h1>
            {isRegisterMenu ? (
              <p className="fo-subtitle">Form Registrasi Pasien Baru</p>
            ) : (
              <p className="fo-subtitle">Ringkasan Antrian Pasien Hari Ini ({today})</p>
            )}
          </div>
          <div className="fo-user">
            <div className="fo-user-info">
              <span className="fo-user-name">{user.full_name}</span>
              <span className="fo-user-role">{user.role_name || 'Front Office'}</span>
            </div>
            <button type="button" className="fo-logout" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </header>

        {isRegisterMenu ? (
          <section className="fo-content fo-content-centered">
            <section className="fo-card fo-form-card">
              <h2>Registrasi Pasien</h2>
              {message && <p className="fo-form-message success">{message}</p>}
              {error && <p className="fo-form-message error">{error}</p>}
              <form className="fo-form" onSubmit={handleSubmit}>
                <div className="fo-form-grid">
                  <div className="fo-form-group">
                    <label htmlFor="namaPasien">Nama Pasien</label>
                    <input
                      id="namaPasien"
                      name="namaPasien"
                      type="text"
                      value={form.namaPasien}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="tanggalMasuk">Tanggal Masuk</label>
                    <input
                      id="tanggalMasuk"
                      name="tanggalMasuk"
                      type="datetime-local"
                      value={form.tanggalMasuk}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="nik">NIK</label>
                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      value={form.nik}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="jenisKelamin">Jenis Kelamin</label>
                    <select
                      id="jenisKelamin"
                      name="jenisKelamin"
                      value={form.jenisKelamin}
                      onChange={handleChange}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="golonganDarah">Golongan Darah</label>
                    <select
                      id="golonganDarah"
                      name="golonganDarah"
                      value={form.golonganDarah}
                      onChange={handleChange}
                    >
                      <option value="O">O</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                    </select>
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="tempatTanggalLahir">Tempat, Tanggal Lahir</label>
                    <input
                      id="tempatTanggalLahir"
                      name="tempatTanggalLahir"
                      type="text"
                      placeholder="Bandung, 01-01-1990"
                      value={form.tempatTanggalLahir}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="nomorTelepon">Nomor Telepon</label>
                    <input
                      id="nomorTelepon"
                      name="nomorTelepon"
                      type="text"
                      value={form.nomorTelepon}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="alamat">Alamat</label>
                    <textarea
                      id="alamat"
                      name="alamat"
                      rows={3}
                      value={form.alamat}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="kategori">Kategori</label>
                    <select
                      id="kategori"
                      name="kategori"
                      value={form.kategori}
                      onChange={handleChange}
                    >
                      <option value="Umum">Umum</option>
                      <option value="Asuransi">Asuransi</option>
                    </select>
                  </div>
                  <div className="fo-form-group">
                    <label htmlFor="pekerjaan">Pekerjaan</label>
                    <input
                      id="pekerjaan"
                      name="pekerjaan"
                      type="text"
                      value={form.pekerjaan}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="fo-form-actions">
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Simpan Data Pasien'}
                  </button>
                </div>
              </form>
            </section>

            <section className="fo-card fo-list-card">
              <div className="fo-card-header" style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <h2 style={{margin: 0}}>Daftar Pasien</h2>
                <span className="fo-card-caption">Data Klinik {clinicId}</span>
                <div style={{marginLeft: 'auto'}}>
                  <button type="button" onClick={loadPatients} disabled={loadingPatients} style={{padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer'}}>
                    {loadingPatients ? 'Memuat...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {loadingPatients ? (
                <p className="fo-list-state">Memuat daftar pasien...</p>
              ) : patientListError ? (
                <p className="fo-form-message error">{patientListError}</p>
              ) : patients.length === 0 ? (
                <p className="fo-list-state">Belum ada data pasien.</p>
              ) : (
                <div className="fo-patient-table-wrap">
                  <div className="fo-patient-table">
                    <div className="fo-patient-table-header">
                      <span>Nama Pasien</span>
                      <span>Tanggal Masuk</span>
                      <span>NIK</span>
                      <span>Jenis Kelamin</span>
                      <span>Gol. Darah</span>
                      <span>TTL</span>
                      <span>Telepon</span>
                      <span>Alamat</span>
                      <span>Kategori</span>
                      <span>Pekerjaan</span>
                    </div>
                    {patients.map((patient) => {
                      const inQueue = isPatientInQueue(patient.id ?? patient.idPasien ?? patient.id_pasien)
                      return (
                        <div key={patient.id} className="fo-patient-table-row">
                          <span>
                            {patient.namaPasien || '-'}
                            {inQueue && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>Pasien sedang dalam antrian</div>}
                          </span>
                        <span>{patient.tanggalMasuk ? new Date(patient.tanggalMasuk).toLocaleString('id-ID') : '-'}</span>
                        <span>{patient.nik || '-'}</span>
                        <span>{patient.jenisKelamin || '-'}</span>
                        <span>{patient.golonganDarah || '-'}</span>
                        <span>{patient.tempatTanggalLahir || '-'}</span>
                        <span>{patient.nomorTelepon || '-'}</span>
                        <span>{patient.alamat || '-'}</span>
                        <span>{patient.kategori || '-'}</span>
                        <span>{patient.pekerjaan || '-'}</span>
                        <span>
                          <button
                            type="button"
                            onClick={() => handleRujukClick(patient.id)}
                            disabled={inQueue}
                            style={{
                              padding: '2px 10px', borderRadius: 6, border: 'none', cursor: inQueue ? 'not-allowed' : 'pointer',
                              background: inQueue ? '#e6e6e6' : '#00FFFF', color: inQueue ? '#9ca3af' : '#000'
                            }}
                          >
                            Rujuk
                          </button>
                        </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </section>
        ) : (
          <section className="fo-content">
              <div style={{ flex: 1 }}>
                <section className="fo-card fo-queue">
                  <div className="fo-card-header">
                    <h2>Antrian Aktif</h2>
                    <span className="fo-card-caption">Loket Utama</span>
                  </div>
                  <div className="fo-table">
                    <div className="fo-table-header">
                      <span>No. Antrian</span>
                      <span>Nama Pasien</span>
                      <span>Nama Dokter</span>
                      <span>Rujukan</span>
                    </div>
                    {loadingQueue ? (
                      <p className="fo-list-state">Memuat antrian...</p>
                    ) : queueError ? (
                      <p className="fo-form-message error">{queueError}</p>
                    ) : activeQueue.length === 0 ? (
                      <p className="fo-list-state">Belum ada antrian aktif.</p>
                    ) : (
                      activeQueue.map((item) => (
                        <div key={item.id} className="fo-table-row">
                          <span>{item.nomorAntrian}</span>
                          <span>{item.namaPasien || '-'}</span>
                          <span>
                            {item.namaDokter && item.namaDokter !== '' ? (
                              item.namaDokter
                            ) : (
                              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                                <button
                                  type="button"
                                  onClick={() => { setDoctorPickerFor(item); setDoctorPickerVisible(true); setAssignError(prev => ({ ...prev, [item.id]: '' })) }}
                                  disabled={loadingDoctors}
                                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
                                >
                                  Pilih Dokter
                                </button>
                                {assignError[item.id] && <div style={{color: '#b91c1c', fontSize: 12}}>{assignError[item.id]}</div>}
                              </div>
                            )}
                            
                          </span>
                          <span>{getPoliName(item.idPoli)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="fo-card fo-rujuk" style={{ marginTop: 12 }}>
                  <div className="fo-card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ margin: 0 }}>Rujukan Ulang</h2>
                    <span className="fo-card-caption">Riwayat rujukan pasien</span>
                    
                  </div>
                  <div style={{ padding: 12 }}>
                    {loadingRujuk ? (
                      <div className="fo-list-state">Memuat rujukan...</div>
                    ) : rujukErrorMsg ? (
                      <div style={{ color: '#b91c1c' }}>{rujukErrorMsg}</div>
                    ) : (!rujukList || rujukList.length === 0) ? (
                      <div className="fo-list-state">Belum ada data rujukan untuk pasien terpilih.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                          <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6eef8' }}>
                              <th style={{ padding: '12px 8px' }}>Tanggal Rujuk</th>
                              <th style={{ padding: '12px 8px' }}>Nama Pasien</th>
                              <th style={{ padding: '12px 8px' }}>Poli Asal</th>
                              <th style={{ padding: '12px 8px' }}>Poli Tujuan</th>
                              <th style={{ padding: '12px 8px' }}>Diagnosis Sementara</th>
                              <th style={{ padding: '12px 8px' }}>Catatan</th>
                              <th style={{ padding: '12px 8px' }}>Nama Dokter</th>
                              <th style={{ padding: '12px 8px' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rujukList.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#475569' }}>{formatToJakarta(r.date_make ?? r.dateMake)}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_pasien ?? r.namaPasien ?? r.nama_pasien ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_poli_asal ?? r.namaPoliAsal ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_poli_tujuan ?? r.namaPoliTujuan ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.diagnosis_sementara ?? r.diagnosisSementara ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.catatan ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>{r.nama_dokter ?? r.namaDokter ?? '-'}</td>
                                <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRujukFromHistory(r, i)}
                                    disabled={!!rujukSubmitting[i]}
                                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
                                  >
                                    {rujukSubmitting[i] ? 'Mengirim...' : 'Rujuk'}
                                  </button>
                                  {rujukActionError[i] && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{rujukActionError[i]}</div>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div style={{ width: 560 }}>
                <section className="fo-card fo-summary">
                  <h2>Ringkasan</h2>
                  <div className="fo-summary-grid">
                    <div className="fo-summary-item">
                      <span className="fo-summary-label">Total Antrian</span>
                      <span className="fo-summary-value">{activeQueue.length}</span>
                    </div>
                    <div className="fo-summary-item">
                      <span className="fo-summary-label">Dipanggil</span>
                      <span className="fo-summary-value">{activeQueue.filter(i => i.idDokter && i.idDokter > 0).length}</span>
                    </div>
                    <div className="fo-summary-item">
                      <span className="fo-summary-label">Menunggu</span>
                      <span className="fo-summary-value">{Math.max(0, activeQueue.length - activeQueue.filter(i => i.idDokter && i.idDokter > 0).length)}</span>
                    </div>
                  </div>
                </section>
              </div>

            
          </section>
        )}
      </main>

      {/* Modal pop-up for rujuk */}
      {showRujuk !== null && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40}}>
          <div style={{width: 440, background: '#fff', borderRadius: 8, padding: 18, boxShadow: '0 8px 30px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <h3 style={{margin: 0}}>Rujuk Pasien</h3>
              <button type="button" onClick={handleCancelRujuk} style={{background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer'}}>×</button>
            </div>

            {loadingPoli ? (
              <p>Memuat daftar poli...</p>
            ) : rujukError ? (
              <p style={{color: '#b91c1c'}}>{rujukError}</p>
            ) : (
              <>
                <p style={{marginTop: 0}}>Pilih poli tujuan untuk pasien:</p>
                <select value={selectedPoli} onChange={handleSelectPoli} style={{width: '100%', padding: 8, marginBottom: 12}}>
                  <option value="">Pilih Poli Tujuan</option>
                  {poliList.map((p) => (
                    <option key={p.id} value={p.id}>{p.namaPoli}</option>
                  ))}
                </select>

                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <button type="button" onClick={handleCancelRujuk} style={{marginRight: 8}}>Batal</button>
                  <button type="button" disabled={!selectedPoli} onClick={async () => {
                    setRujukError('')
                    try {
                      const payload = { idPasien: showRujuk, idPoli: Number(selectedPoli) }
                      const resp = await fetch(`${API_BASE_URL}/antrian/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                      if (!resp.ok) {
                        const text = await resp.text()
                        throw new Error(text || 'Gagal menambahkan antrian')
                      }
                      setShowRujuk(null)
                      setPoliList([])
                      setSelectedPoli('')
                      setMessage('Rujukan berhasil ditambahkan')
                      // refresh queue
                      try {
                        const qres = await fetch(`${API_BASE_URL}/antrian/`)
                        if (qres.ok) {
                          const qdata = await qres.json()
                          const items = Array.isArray(qdata) ? qdata.filter(it => Number(it.status) === 1) : []
                          setActiveQueue(items)
                        }
                      } catch (e) { /* ignore */ }
                    } catch (err) {
                      console.error(err)
                      setRujukError('Gagal mengirim rujukan')
                    }
                  }} style={{background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6}}>Konfirmasi</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {doctorPickerVisible && doctorPickerFor && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50}}>
          <div style={{width: 540, background: '#fff', borderRadius: 8, padding: 18, boxShadow: '0 8px 30px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <h3 style={{margin: 0}}>Pilih Dokter untuk {doctorPickerFor?.namaPasien || '-'}</h3>
              <button type="button" onClick={() => { setDoctorPickerVisible(false); setDoctorPickerFor(null); }} style={{background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer'}}>×</button>
            </div>
            <div style={{maxHeight: '50vh', overflowY: 'auto'}}>
              {
                (() => {
                  const poliId = doctorPickerFor.idPoli ?? doctorPickerFor.id_poli ?? doctorPickerFor.poli_id ?? doctorPickerFor.poliId
                  const avail = doctors.filter(d => {
                    const dp = d.idPoli ?? d.id_poli ?? d.poli_id ?? d.poliId ?? d.poli ?? d.polis ?? d.polies
                    if (Array.isArray(dp)) {
                      return dp.some(x => String(x?.id ?? x) === String(poliId))
                    }
                    if (dp && typeof dp === 'object') {
                      return String(dp.id ?? dp.id_poli ?? dp.poli_id ?? dp) === String(poliId)
                    }
                    return String(dp) === String(poliId)
                  })
                  if (avail.length === 0) return <div>Tidak ada dokter untuk poli ini.</div>
                  return avail.map((d) => (
                    <div key={d.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9'}}>
                      <div>{d.namaDokter}</div>
                      <div>
                        <button
                          type="button"
                          disabled={assigning[doctorPickerFor.id]}
                          onClick={async () => {
                            const itemId = doctorPickerFor.id
                            const docId = d.id
                            if (!itemId || !docId) return
                            setAssigning(prev => ({ ...prev, [itemId]: true }))
                            setAssignError(prev => ({ ...prev, [itemId]: '' }))
                            try {
                              const resp = await fetch(`${API_BASE_URL}/antrian/${itemId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idDokter: Number(docId) }),
                              })
                              if (!resp.ok) {
                                const t = await resp.text().catch(() => '')
                                throw new Error(t || 'Gagal assign dokter')
                              }
                              setActiveQueue(prev => prev.map(q => q.id === itemId ? { ...q, idDokter: Number(docId), namaDokter: (doctors.find(x => String(x.id) === String(docId)) || {}).namaDokter || '' } : q))
                              setDoctorPickerVisible(false)
                              setDoctorPickerFor(null)
                            } catch (err) {
                              console.error(err)
                              setAssignError(prev => ({ ...prev, [itemId]: 'Gagal update dokter' }))
                            } finally {
                              setAssigning(prev => ({ ...prev, [itemId]: false }))
                            }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          {assigning[doctorPickerFor.id] ? 'Menyimpan...' : 'Pilih'}
                        </button>
                      </div>
                    </div>
                  ))
                })()
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FrontOfficeDashboard
