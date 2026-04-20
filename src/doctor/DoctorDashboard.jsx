import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api'

function DoctorDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState({
    full_name: 'Dr. Andi Setiawan',
    role_name: 'Dokter',
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser((prev) => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      console.error('Gagal membaca user dari localStorage', e)
    }
  }, [])

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

  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState('')

  useEffect(() => {
    const loadAppointmentsForDoctor = async () => {
      setLoadingAppointments(true)
      setAppointmentsError('')
      try {
        // baca user dari localStorage
        const stored = localStorage.getItem('user')
        const parsedUser = stored ? JSON.parse(stored) : null
        const userId = parsedUser?.id ?? parsedUser?.userId ?? parsedUser?.id_user

        // ambil daftar dokter, cari yang terhubung dengan user ini
        const dokterRes = await fetch(`${API_BASE_URL}/dokter/`)
        if (!dokterRes.ok) throw new Error('Gagal mengambil daftar dokter')
        const dokterData = await dokterRes.json()
        const dokters = Array.isArray(dokterData) ? dokterData : []

        const myDokter = dokters.find((d) => (d.id_user == userId) || (d.idUser == userId) || (d.user_id == userId))

        if (!myDokter) {
          // tidak ditemukan dokter untuk user ini -> kosongkan daftar
          setAppointments([])
          setLoadingAppointments(false)
          return
        }

        const myDokterId = myDokter.id

        // ambil antrian dan hanya ambil yang sesuai id_dokter
        const res = await fetch(`${API_BASE_URL}/antrian/`)
        if (!res.ok) throw new Error('Gagal mengambil antrian')
        const data = await res.json()
        const filtered = (Array.isArray(data) ? data : []).filter((it) => (
          // dukung beberapa penamaan field yang mungkin berbeda
          (it.idDokter != null && it.idDokter == myDokterId) ||
          (it.id_dokter != null && it.id_dokter == myDokterId) ||
          (it.id_dokter_pasien != null && it.id_dokter_pasien == myDokterId)
        ))

        // order by waktu (if present) then by id, then assign sequential nomorAntrian starting from 1
        const toMillis = (x) => {
          if (!x) return 0
          const t = Date.parse(x)
          return isNaN(t) ? 0 : t
        }
        const ordered = filtered.slice().sort((a, b) => {
          const ta = toMillis(a.waktu) || a.id || 0
          const tb = toMillis(b.waktu) || b.id || 0
          return ta - tb
        })

        // fetch patient details for all patient IDs in the ordered list
        const patientIds = Array.from(new Set(ordered.map(it => it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id_pasien_pasien).filter(Boolean)))
        const patientMap = {}
        await Promise.all(patientIds.map(async (pid) => {
          try {
            const pres = await fetch(`${API_BASE_URL}/patients/?idPasien=${encodeURIComponent(pid)}`)
            if (!pres.ok) return
            const pdata = await pres.json()
            const p = Array.isArray(pdata) ? pdata[0] : pdata
            if (p && p.id != null) patientMap[String(p.id)] = p
          } catch (e) {
            console.error('Gagal mengambil data pasien', pid, e)
          }
        }))

        const mapped = ordered.map((it, idx) => {
          const pid = it.idPasien ?? it.id_pasien ?? it.pasien_id ?? it.id_pasien_pasien
          const p = pid ? patientMap[String(pid)] : null
          const noRekam = p?.noRekamMedis || p?.no_rekam_medis || p?.noRekam || '-'
          const tMasuk = p?.tanggalMasuk || p?.tanggal_masuk || p?.tanggal || null
          const tanggalStr = tMasuk ? new Date(tMasuk).toLocaleString('id-ID') : '-'
          const jenisKelamin = p?.jenisKelamin || p?.jenis_kelamin || '-'

          return {
            id: it.id,
            nomorAntrian: idx + 1,
            name: it.namaPasien || '-',
            patientNoRekam: noRekam,
            patientTanggalMasuk: tanggalStr,
            patientJK: jenisKelamin,
            status: (it.idDokter && it.idDokter > 0) || (it.id_dokter && it.id_dokter > 0) ? 'Dipanggil' : 'Menunggu',
          }
        })

        setAppointments(mapped)
      } catch (err) {
        console.error(err)
        setAppointmentsError('Tidak dapat memuat janji temu')
      } finally {
        setLoadingAppointments(false)
      }
    }

    loadAppointmentsForDoctor()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setMenuOpen(false)
    navigate('/')
  }

  const handlePeriksa = (item) => {
    try {
      console.log('PERIKSA clicked for', item)
      // placeholder action - navigate or open modal can be implemented later
      alert(`Periksa pasien: ${item.name}`)
    } catch (e) {
      console.error(e)
    }
  }

  const navigateToPemeriksaan = async () => {
    try {
      const stored = localStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      const userId = parsed?.id ?? parsed?.userId ?? parsed?.id_user

      const dokterRes = await fetch(`${API_BASE_URL}/dokter/`)
      if (!dokterRes.ok) throw new Error('Gagal mengambil daftar dokter')
      const dokterData = await dokterRes.json()
      const dokters = Array.isArray(dokterData) ? dokterData : []

      const myDokter = dokters.find((d) => (d.id_user == userId) || (d.idUser == userId) || (d.user_id == userId))
      const poliVal = myDokter?.poli ?? myDokter?.idPoli ?? myDokter?.poli_id ?? myDokter?.id_poli ?? null

      if (Number(poliVal) === 1) {
        navigate('/pemeriksaan')
      } else if (Number(poliVal) === 2) {
        navigate('/pemeriksaan/penyaki-dalam')
      } else if (Number(poliVal) === 3) {
        navigate('/pemeriksaan/anak')
      } else {
        // fallback
        navigate('/pemeriksaan')
      }
    } catch (e) {
      console.error('Gagal navigasi pemeriksaan', e)
      navigate('/pemeriksaan')
    }
  }

  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
          <button className="sidebar-item active">
            <span className="sidebar-icon">🏠</span>
            <span>Dashboard Utama</span>
          </button>
          <button className="sidebar-item" onClick={navigateToPemeriksaan}>
            <span className="sidebar-icon">🩺</span>
            <span>Pemeriksaan</span>
          </button>
        </nav>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <h1 className="doctor-title">Selamat Datang Kembali, {user.full_name}!</h1>
            <p className="doctor-date">Ringkasan Janji Temu Hari Ini ({today})</p>
          </div>
          <div className="doctor-profile-wrapper">
            <button
              type="button"
              className="doctor-profile"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <div className="profile-info">
                <span className="profile-name">{user.full_name}</span>
                <span className="profile-role">{user.role_name || 'Dokter'}</span>
              </div>
              <div className="profile-avatar">{initials}</div>
            </button>
            {menuOpen && (
              <div className="profile-menu">
                <button type="button" className="profile-menu-item" disabled>
                  Profil
                </button>
                <button type="button" className="profile-menu-item" disabled>
                  Pesan
                </button>
                <button
                  type="button"
                  className="profile-menu-item profile-menu-logout"
                  onClick={handleLogout}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="doctor-grid">
          <section className="doctor-card doctor-appointments">
            <div className="card-header">
              <h2>Janji Temu Hari Ini</h2>
              <span className="card-caption">{today}</span>
            </div>
            <div className="appointments-table">
              <div className="appointments-header">
                <span>No. Antrian</span>
                <span>Nama Pasien</span>
                <span>Informasi Pasien</span>
                <span>Status</span>
                <span aria-hidden="true" />
              </div>
              {appointments.map((item) => (
                <div key={item.id} className="appointments-row">
                  <span>{item.nomorAntrian}</span>
                  <span>{item.name}</span>
                  <span>
                    <div><strong>No Rekam Medis:</strong> {item.patientNoRekam || '-'}</div>
                    <div><strong>Tanggal Masuk:</strong> {item.patientTanggalMasuk || '-'}</div>
                    <div><strong>JK:</strong> {item.patientJK || '-'}</div>
                  </span>
                  <span>
                    <span
                      className={
                        item.status === 'Selesai'
                          ? 'status-pill status-done'
                          : 'status-pill status-pending'
                      }
                    >
                      {item.status}
                    </span>
                  </span>
                  <span>
                    <button type="button" className="periksa-btn" onClick={() => handlePeriksa(item)}>
                      PERIKSA
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="doctor-side-column">
            <div className="doctor-card doctor-patients">
              <h2>Pasien Terakhir Ditemui</h2>
              <div className="patient-list">
                <div className="patient-item">
                  <div className="patient-avatar">BS</div>
                  <div>
                    <div className="patient-name">Budi Santoso</div>
                    <div className="patient-meta">55th • Hipertensi &amp; Diabetes</div>
                  </div>
                </div>
                <div className="patient-item">
                  <div className="patient-avatar">SA</div>
                  <div>
                    <div className="patient-name">Siti Aminah</div>
                    <div className="patient-meta">55th • Hipertensi &amp; Lab</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="doctor-card doctor-alerts">
              <h2>Notifikasi Penting &amp; Alert</h2>
              <ul className="alert-list">
                <li className="alert-item alert-critical">
                  <span className="alert-icon">!</span>
                  <div>
                    <div className="alert-title">Hasil Lab: Budi Santoso</div>
                    <div className="alert-text">Segera tinjau hasil lab terbaru.</div>
                  </div>
                </li>
                <li className="alert-item alert-warning">
                  <span className="alert-icon">!</span>
                  <div>
                    <div className="alert-title">Pesan Mendesak dari Lab</div>
                    <div className="alert-text">Ada catatan penting terkait pasien baru.</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="doctor-card doctor-chart">
              <h2>Kunjungan Pasien (Bulan Ini)</h2>
              <div className="chart-placeholder">
                <div className="chart-line" />
                <span className="chart-caption">Grafik kunjungan pasien akan ditampilkan di sini.</span>
              </div>
            </div>
          </section>
        </section>

        <footer className="doctor-footer">
          © 2026 Sistem Rekam Medis Elektronik. Data pasien terlindungi dan
          terenkripsi.
        </footer>
      </main>
    </div>
  )
}

export default DoctorDashboard
