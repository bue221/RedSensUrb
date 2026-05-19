// Utility helpers

export const ZONE_COLORS = ['#5b8cff','#7ee0c4','#f5b454','#ff5d6c','#b48cff','#4dd0e1','#ff8a65','#a5d6a7']

export function colorForZone(zoneId, idx) {
  return ZONE_COLORS[idx % ZONE_COLORS.length]
}

export function nodeFreshness(lastSeenIso, now = Date.now()) {
  if (!lastSeenIso) return { state: 'off', age: Infinity }
  const t = new Date(lastSeenIso).getTime()
  const age = (now - t) / 1000
  if (age < 10)  return { state: 'on', age }
  if (age < 30)  return { state: 'stale', age }
  return { state: 'off', age }
}

export function fmtAge(secs) {
  if (!isFinite(secs)) return '—'
  if (secs < 60)   return `${Math.round(secs)}s`
  if (secs < 3600) return `${Math.round(secs/60)}m`
  return `${Math.round(secs/3600)}h`
}

export function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour12: false })
}

export function thresholds(metric, v) {
  // returns 'ok' | 'warn' | 'high'
  if (metric === 'temperatureC') {
    if (v >= 40) return 'high'
    if (v >= 32) return 'warn'
    return 'ok'
  }
  if (metric === 'humidityPct') {
    if (v <= 15 || v >= 90) return 'high'
    if (v <= 25 || v >= 80) return 'warn'
    return 'ok'
  }
  if (metric === 'co2Ppm') {
    if (v >= 2000) return 'high'
    if (v >= 1000) return 'warn'
    return 'ok'
  }
  return 'ok'
}

export function groupBySensor(samples) {
  const m = new Map()
  for (const s of samples) {
    if (!m.has(s.sensorId)) m.set(s.sensorId, [])
    m.get(s.sensorId).push(s)
  }
  // ascending by time
  for (const arr of m.values()) arr.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))
  return m
}

export function groupByZone(samples) {
  const m = new Map()
  for (const s of samples) {
    if (!m.has(s.zoneId)) m.set(s.zoneId, [])
    m.get(s.zoneId).push(s)
  }
  for (const arr of m.values()) arr.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))
  return m
}
