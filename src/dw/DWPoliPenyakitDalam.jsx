import React from 'react'
import DWLayout from './DWLayout'

export default function DWPoliPenyakitDalam() {
  return (
    <DWLayout>
      <div className="doctor-header">
        <div>
          <h1 className="doctor-title">Data Warehouse RME-LINK - Poli Penyakit Dalam</h1>
          <p className="doctor-date">{new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-card">
          {/* Konten kosong sementara */}
        </div>
      </div>
    </DWLayout>
  )
}
