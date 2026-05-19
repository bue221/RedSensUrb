import React, { useMemo } from 'react'
import { nodeFreshness, fmtAge, fmtTime, groupByZone, thresholds } from '../util'

// Minimal markdown renderer (h1/h2/h3, tables, code, bold, lists)
function renderMD(md) {
  const lines = md.split('\n')
  const out = []
  let i = 0
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\b(OK)\b/g, '<span class="ok">$1</span>')
      .replace(/\b(WARN|WARNING)\b/g, '<span class="warn">$1</span>')
      .replace(/\b(CRIT|CRITICAL|HIGH|DOWN)\b/g, '<span class="bad">$1</span>')
  }
  while (i < lines.length) {
    const ln = lines[i]
    if (ln.startsWith('### ')) { out.push(`<h3>${inline(ln.slice(4))}</h3>`); i++; continue }
    if (ln.startsWith('## '))  { out.push(`<h2>${inline(ln.slice(3))}</h2>`); i++; continue }
    if (ln.startsWith('# '))   { out.push(`<h1>${inline(ln.slice(2))}</h1>`); i++; continue }

    // table
    if (ln.startsWith('|') && lines[i+1] && /^\|\s*-/.test(lines[i+1])) {
      const headers = ln.split('|').slice(1,-1).map(s => s.trim())
      i += 2
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').slice(1,-1).map(s => s.trim()))
        i++
      }
      out.push(`<table><thead><tr>${headers.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${
        rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
      }</tbody></table>`)
      continue
    }
    if (ln.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++ }
      out.push(`<ul>${items.map(it => `<li>${inline(it)}</li>`).join('')}</ul>`)
      continue
    }
    if (ln.trim() === '') { out.push('<br/>'); i++; continue }
    out.push(`<p>${inline(ln)}</p>`); i++
  }
  return out.join('\n')
}

export default function MarkdownReport({ nodes, samples, alerts }) {
  const md = useMemo(() => {
    const nodeMap = nodes?.nodes || {}
    const nodeIds = Object.keys(nodeMap)
    const fresh = nodeIds.map(id => ({ id, ...nodeFreshness(nodeMap[id]) }))
    const on    = fresh.filter(f => f.state === 'on').length
    const stale = fresh.filter(f => f.state === 'stale').length
    const off   = fresh.filter(f => f.state === 'off').length

    const byZone = groupByZone(samples)
    const zoneRows = [...byZone.entries()].map(([z, arr]) => {
      const last = arr[arr.length-1]
      const tCls = thresholds('temperatureC', last.temperatureC).toUpperCase()
      const cCls = thresholds('co2Ppm', last.co2Ppm).toUpperCase()
      return `| ${z} | ${last.temperatureC.toFixed(1)} °C | ${last.humidityPct.toFixed(0)} % | ${last.co2Ppm} ppm | ${tCls === 'HIGH' ? 'CRITICAL' : tCls === 'WARN' ? 'WARN' : 'OK'} | ${cCls === 'HIGH' ? 'CRITICAL' : cCls === 'WARN' ? 'WARN' : 'OK'} |`
    }).join('\n')

    const recentAlerts = (alerts || []).slice(0, 5)
    const alertsBlock = recentAlerts.length
      ? recentAlerts.map(a => `- **${(a.severity||'INFO').toUpperCase()}** \`${a.zoneId||'—'}\` · ${a.metric||''} = \`${a.value??'?'}\` (umbral ${a.threshold ?? '—'}) — ${fmtTime(a.timestamp || a.createdAt)}`).join('\n')
      : '- _Sin alertas en el historial._'

    const offNodes = fresh.filter(f => f.state !== 'on')
      .map(f => `- \`${f.id}\` — ${f.state.toUpperCase()} · última señal ${fmtAge(f.age)}`)
      .join('\n') || '- _Todos los nodos al aire ✅_'

    return `# 📊 Reporte de Red en vivo
_Generado: ${new Date().toLocaleString('es-AR')}_

## Estado de la flota
- Nodos totales: **${nodeIds.length}**
- En línea (OK): **${on}**
- Lentos (WARN): **${stale}**
- Caídos (DOWN): **${off}**

## Último valor por zona
| Zona | Temp | Humedad | CO₂ | Temp est. | CO₂ est. |
| ---- | ---- | ------- | --- | --------- | -------- |
${zoneRows || '| _Sin datos aún_ |  |  |  |  |  |'}

## Nodos con atención
${offNodes}

## Últimas alertas
${alertsBlock}
`
  }, [nodes, samples, alerts])

  return (
    <div className="panel">
      <h3>Reporte (Markdown en vivo)</h3>
      <div className="md" dangerouslySetInnerHTML={{ __html: renderMD(md) }} />
    </div>
  )
}
