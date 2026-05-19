import React from 'react'
import { fmtTime } from '../util'

function sevOf(a) {
  const s = (a.severity || a.SEVERITY || '').toString().toUpperCase()
  if (s.includes('CRIT')) return 'CRITICAL'
  if (s.includes('WARN')) return 'WARNING'
  return s || 'INFO'
}

export default function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="panel">
        <h3>Alertas</h3>
        <div style={{color:'var(--muted)', padding:'30px 0', textAlign:'center'}}>Sin alertas registradas ✅</div>
      </div>
    )
  }
  return (
    <div className="panel">
      <h3>Alertas <span className="badge">{alerts.length}</span></h3>
      <div style={{maxHeight: 360, overflow:'auto', paddingRight:4}}>
        {alerts.map((a, i) => {
          const sev = sevOf(a)
          const ts = a.timestamp || a.createdAt || a.ts
          const zone = a.zoneId || a.zone || '—'
          const metric = a.metric || a.kind || ''
          const value = a.value ?? a.measurement
          const threshold = a.threshold
          return (
            <div className={`alert-row ${sev}`} key={i}>
              <span className="sev">{sev}</span>
              <div>
                <div><b>{zone}</b> · {metric} <code style={{background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:4}}>{value}</code>
                  {threshold !== undefined && <span style={{color:'var(--muted)'}}> &gt; umbral {threshold}</span>}
                </div>
                <div className="meta">
                  {a.source ? `📡 ${a.source}` : ''}
                  {a.status ? ` · estado: ${a.status}` : ''}
                  {a.txId ? ` · tx: ${a.txId}` : ''}
                </div>
              </div>
              <span className="meta">{fmtTime(ts)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
