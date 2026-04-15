import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function FrontOfficeDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState({
    full_name: 'Petugas Front Office',
    role_name: 'Front Office',
  })
  const [activeMenu, setActiveMenu] = useState('queue')
  const [form, setForm] = useState({
    namaPasien: '',
    tanggalMasuk: '',
    nik: '',
    jenisKelamin: 'Laki-laki',
    golonganDarah: 'O',
    tempatTanggalLahir: '',
    nomorTelepon: '',
    alamat: '',
    kategori: 'Umum',
    pekerjaan: '',
    idDataKlinik: 1,
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMenuClick = (key) => {
    setActiveMenu(key)
    setMessage('')
    setError('')
  }

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
      const res = await fetch('http://localhost:8080/patients/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          tanggalMasuk,
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
    } catch (err) {
      console.error(err)
      setError('Tidak dapat terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  const today = 'Selasa, 15 April 2026'
  const queue = [
    { number: 'A001', name: 'Budi Santoso', service: 'Pendaftaran Rawat Jalan', status: 'Dipanggil' },
    { number: 'A002', name: 'Siti Aminah', service: 'Pendaftaran Lab', status: 'Menunggu' },
    { number: 'A003', name: 'Andi Pratama', service: 'Pendaftaran Rawat Inap', status: 'Menunggu' },
  ]

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
            Dashboard Antrian
          </button>
          <button
            className={activeMenu === 'register' ? 'fo-menu-item active' : 'fo-menu-item'}
            type="button"
            onClick={() => handleMenuClick('register')}
          >
            Registrasi Pasien
          </button>
          <button className="fo-menu-item">Pendaftaran Janji Temu</button>
          <button className="fo-menu-item">Pembayaran &amp; Kasir</button>
        </nav>
      </aside>

      <main className="fo-main">
        <header className="fo-header">
          <div>
            <h1 className="fo-title">Dashboard Front Office</h1>
            {activeMenu === 'queue' ? (
              <p className="fo-subtitle">Ringkasan Antrian Pasien Hari Ini ({today})</p>
            ) : (
              <p className="fo-subtitle">Form Registrasi Pasien Baru</p>
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

        {activeMenu === 'queue' ? (
          <section className="fo-content">
            <section className="fo-card fo-queue">
              <div className="fo-card-header">
                <h2>Antrian Aktif</h2>
                <span className="fo-card-caption">Loket Utama</span>
              </div>
              <div className="fo-table">
                <div className="fo-table-header">
                  <span>No. Antrian</span>
                  <span>Nama Pasien</span>
                  <span>Layanan</span>
                  <span>Status</span>
                </div>
                {queue.map((item) => (
                  <div key={item.number} className="fo-table-row">
                    <span>{item.number}</span>
                    <span>{item.name}</span>
                    <span>{item.service}</span>
                    <span className={item.status === 'Dipanggil' ? 'fo-status fo-status-call' : 'fo-status fo-status-wait'}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fo-card fo-summary">
              <h2>Ringkasan</h2>
              <div className="fo-summary-grid">
                <div className="fo-summary-item">
                  <span className="fo-summary-label">Total Antrian</span>
                  <span className="fo-summary-value">{queue.length}</span>
                </div>
                <div className="fo-summary-item">
                  <span className="fo-summary-label">Dipanggil</span>
                  <span className="fo-summary-value">1</span>
                </div>
                <div className="fo-summary-item">
                  <span className="fo-summary-label">Menunggu</span>
                  <span className="fo-summary-value">2</span>
                </div>
              </div>
            </section>
          </section>
        ) : (
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
                    <option value="BPJS">BPJS</option>
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
                <div className="fo-form-group">
                  <label htmlFor="idDataKlinik">ID Data Klinik</label>
                  <input
                    id="idDataKlinik"
                    name="idDataKlinik"
                    type="number"
                    min={1}
                    value={form.idDataKlinik}
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
        )}
      </main>
    </div>
  )
}

export default FrontOfficeDashboard
