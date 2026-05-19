import React, { useState, useMemo } from 'react'
import { groupByZone, colorForZone, fmtTime } from '../util'

const METRICS = [
  { key: 'temperatureC', label: 'Temperatura (°C)', unit: '°C' },
  { key: 'humidityPct',  label: 'Humedad (%)',     unit: '%' },
  { key: 'co2Ppm',       label: 'CO₂ (ppm)',       unit: ' ppm' },
]

export default function TimeSeriesChart({ samples }) {
  const [metric, setMetric] = useState('temperatureC')
  const [hover, setHover] = useState(null)

  const series = useMemo(() => {
    const byZone = groupByZone(samples)
    return [...byZone.entries()].map(([zoneId, arr], idx) => ({
      zoneId,
      color: colorForZone(zoneId, idx),
      points: arr.map(s => ({ t: new Date(s.timestamp).getTime(), v: s[metric] }))
    }))
  }, [samples, metric])

  const W = 760, H = 280, padL = 44, padR = 16, padT = 16, padB = 30
  const allPts = series.flatMap(s => s.points)
  if (allPts.length === 0) {
    return (
      <div className="panel">
        <h3>Telemetría en vivo</h3>
        <div style={{color:'var(--muted)', padding:'40px 0', textAlign:'center'}}>Esperando datos de los nodos…</div>
      </div>
    )
  }

  const tMin = Math.min(...allPts.map(p => p.t))
  const tMax = Math.max(...allPts.map(p => p.t))
  const vMin = Math.min(...allPts.map(p => p.v))
  const vMax = Math.max(...allPts.map(p => p.v))
  const vSpan = (vMax - vMin) || 1
  const tSpan = (tMax - tMin) || 1
  const xOf = t => padL + ((t - tMin) / tSpan) * (W - padL - padR)
  const yOf = v => padT + (1 - (v - vMin) / vSpan) * (H - padT - padB)

  // Y axis ticks
  const yTicks = 5
  const ticks = Array.from({length: yTicks+1}, (_, i) => vMin + (vSpan * i / yTicks))

  // X axis ticks
  const xTicks = 5
  const xticks = Array.from({length: xTicks+1}, (_, i) => tMin + (tSpan * i / xTicks))

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < padL || x > W - padR) { setHover(null); return }
    const t = tMin + ((x - padL) / (W - padL - padR)) * tSpan
    // pick nearest point per series
    const items = series.map(s => {
      let best = null, bd = Infinity
      for (const p of s.points) {
        const d = Math.abs(p.t - t)
        if (d < bd) { bd = d; best = p }
      }
      return best ? { zoneId: s.zoneId, color: s.color, v: best.v, t: best.t } : null
    }).filter(Boolean)
    setHover({ x, t, items })
  }

  return (
    <div className="panel">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3>Telemetría en vivo <span className="badge">{series.length} zonas</span></h3>
        <div className="chart-tabs">
          {METRICS.map(m => (
            <button key={m.key} className={metric === m.key ? 'active' : ''} onClick={() => setMetric(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {/* Y grid + labels */}
        {ticks.map((tv, i) => {
          const y = yOf(tv)
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--grid)" strokeDasharray="3,3" />
              <text x={padL - 8} y={y + 3} fill="var(--muted)" fontSize="10" textAnchor="end">{tv.toFixed(1)}</text>
            </g>
          )
        })}
        {/* X labels */}
        {xticks.map((tx, i) => (
          <text key={i} x={xOf(tx)} y={H - 10} fill="var(--muted)" fontSize="10" textAnchor="middle">{fmtTime(new Date(tx).toISOString())}</text>
        ))}

        {/* Series */}
        {series.map(s => {
          if (s.points.length < 2) return null
          const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.t)},${yOf(p.v)}`).join(' ')
          return (
            <g key={s.zoneId}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.points.slice(-1).map((p, i) => (
                <circle key={i} cx={xOf(p.t)} cy={yOf(p.v)} r="3.5" fill={s.color} stroke="#0b1020" strokeWidth="2" />
              ))}
            </g>
          )
        })}

        {/* Hover */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.2)" />
            {hover.items.map((it, i) => (
              <circle key={i} cx={hover.x} cy={yOf(it.v)} r="4" fill={it.color} />
            ))}
          </g>
        )}
      </svg>

      {hover && (
        <div style={{
          fontSize:12, color:'var(--muted)', display:'flex', gap:14, flexWrap:'wrap',
          padding:'8px 4px 0', borderTop:'1px solid var(--border)', marginTop:4
        }}>
          <span>🕒 {fmtTime(new Date(hover.t).toISOString())}</span>
          {hover.items.map(it => (
            <span key={it.zoneId} style={{color:'var(--text)'}}>
              <span style={{display:'inline-block', width:8, height:8, borderRadius:2, background:it.color, marginRight:6}}/>
              <b>{it.zoneId}</b>: {it.v?.toFixed?.(2) ?? it.v}
            </span>
          ))}
        </div>
      )}

      <div className="legend">
        {series.map(s => (
          <div className="item" key={s.zoneId}>
            <span className="swatch" style={{background: s.color}} />
            <span>{s.zoneId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
