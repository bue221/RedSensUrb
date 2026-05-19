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

  const metricMeta = METRICS.find(m => m.key === metric) || METRICS[0]
  const W = 820, H = 320, padL = 52, padR = 72, padT = 18, padB = 36
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
  const rawMin = Math.min(...allPts.map(p => p.v))
  const rawMax = Math.max(...allPts.map(p => p.v))
  // pad the value range a bit so the line never touches the edges
  const pad = ((rawMax - rawMin) || Math.abs(rawMax) || 1) * 0.1
  const vMin = rawMin - pad
  const vMax = rawMax + pad
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
      <div className="chart-header">
        <h3 style={{margin:0}}>Telemetría en vivo <span className="badge">{series.length} zonas</span> <span className="badge" style={{marginLeft:4}}>{metricMeta.unit.trim()}</span></h3>
        <div className="chart-tabs">
          {METRICS.map(m => (
            <button key={m.key} className={metric === m.key ? 'active' : ''} onClick={() => setMetric(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-host">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.zoneId} id={`g-${s.zoneId}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Plot frame */}
        <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB}
              fill="rgba(255,255,255,0.015)" stroke="var(--border)" />

        {/* Y grid + labels (with unit) */}
        {ticks.map((tv, i) => {
          const y = yOf(tv)
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--grid)" strokeDasharray="3,3" />
              <text x={padL - 8} y={y + 3} fill="var(--muted)" fontSize="10" textAnchor="end">
                {tv.toFixed(metric === 'co2Ppm' ? 0 : 1)}{metricMeta.unit}
              </text>
            </g>
          )
        })}
        {/* X labels + vertical grid */}
        {xticks.map((tx, i) => (
          <g key={i}>
            <line x1={xOf(tx)} x2={xOf(tx)} y1={padT} y2={H - padB} stroke="var(--grid)" strokeDasharray="2,4" />
            <text x={xOf(tx)} y={H - 14} fill="var(--muted)" fontSize="10" textAnchor="middle">{fmtTime(new Date(tx).toISOString())}</text>
          </g>
        ))}

        {/* Series: area + line + last value label */}
        {series.map(s => {
          if (s.points.length < 2) return null
          const line = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.t)},${yOf(p.v)}`).join(' ')
          const first = s.points[0]
          const last  = s.points[s.points.length - 1]
          const area = `${line} L${xOf(last.t)},${H - padB} L${xOf(first.t)},${H - padB} Z`
          const lx = Math.min(xOf(last.t) + 8, W - padR + 4)
          const ly = yOf(last.v)
          return (
            <g key={s.zoneId}>
              <path d={area} fill={`url(#g-${s.zoneId})`} />
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={xOf(last.t)} cy={ly} r="4" fill={s.color} stroke="#0b1020" strokeWidth="2" />
              <text x={lx} y={ly + 4} fill={s.color} fontSize="11" fontWeight="700">
                {last.v?.toFixed?.(metric === 'co2Ppm' ? 0 : 1) ?? last.v}{metricMeta.unit}
              </text>
            </g>
          )
        })}

        {/* Hover */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.35)" strokeDasharray="3,3" />
            {hover.items.map((it, i) => (
              <circle key={i} cx={hover.x} cy={yOf(it.v)} r="4" fill={it.color} stroke="#0b1020" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      </div>

      {hover && (
        <div className="chart-cursor">
          <span>🕒 {fmtTime(new Date(hover.t).toISOString())}</span>
          {hover.items.map(it => (
            <span key={it.zoneId}>
              <span style={{display:'inline-block', width:8, height:8, borderRadius:2, background:it.color, marginRight:6, verticalAlign:'middle'}}/>
              <b>{it.zoneId}</b>: {it.v?.toFixed?.(metric === 'co2Ppm' ? 0 : 2) ?? it.v}{metricMeta.unit}
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
