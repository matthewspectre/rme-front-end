import React from 'react'
import { useNavigate } from 'react-router-dom'

function DWMenu({ style }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', display: 'inline-block', ...style }}>
      <div style={{ fontSize: 14, marginBottom: 8, color: '#374151' }}>Menu Terpisah</div>
      <button onClick={() => navigate('/dw-login')} style={{ background: '#0ea5a4', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Login Data Warehouse</button>
    </div>
  )
}

export default DWMenu
