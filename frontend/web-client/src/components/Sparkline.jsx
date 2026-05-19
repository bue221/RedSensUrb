import React from 'react'

export default function Sparkline({ values, width = 200, height = 36, color = '#5b8cff', fill = true }) {
  if (!values || values.length < 2) {
    return <svg width={width} height={height} />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)
  const pts = values.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 4) - 2])
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`
  const gid = `g-${Math.random().toString(36).slice(2,8)}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color} />
    </svg>
  )
}
