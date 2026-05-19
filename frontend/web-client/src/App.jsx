import React, { useEffect, useMemo, useState } from 'react'
import { api, API_BASE } from './api'
import { nodeFreshness } from './util'
import NodesGrid from './components/NodesGrid'
import TimeSeriesChart from './components/TimeSeriesChart'
import AlertsPanel from './components/AlertsPanel'
import AlertComposer from './components/AlertComposer'
import MarkdownReport from './components/MarkdownReport'

export default function App() {
  const [telemetry, setTelemetry] = useState([])
  const [nodes, setNodes]         = useState({ nodes: {} })
  const [alerts, setAlerts]       = useState([])
  const [connected, setConnected] = useState(false)
  const [lastTick, setLastTick]   = useState(null)

  useEffect(() => {
    let cancelled = false
    async function tick() {
      try {
        const [t, n, a] = await Promise.all([
          api.telemetry(200), api.nodes(), api.alerts(50).catch(() => [])
        ])
        if (cancelled) return
        // backend returns most-recent-first; reverse for chart ascending
        setTelemetry(Array.isArray(t) ? [...t].reverse() : [])
        setNodes(n || { nodes: {} })
        setAlerts(Array.isArray(a) ? a : [])
        setConnected(true)
        setLastTick(new Date())
      } catch (e) {
        if (!cancelled) setConnected(false)
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const stats = useMemo(() => {
    const nodeMap = nodes?.nodes || {}
    const ids = Object.keys(nodeMap)
    const fresh = ids.map(id => nodeFreshness(nodeMap[id]))
    const on    = fresh.filter(f => f.state === 'on').length
    const stale = fresh.filter(f => f.state === 'stale').length
    const off   = fresh.filter(f => f.state === 'off').length
    const zones = new Set(telemetry.map(s => s.zoneId))
    // samples per minute (rough): count samples in last 60s
    const now = Date.now()
    const recent = telemetry.filter(s => now - new Date(s.timestamp).getTime() < 60_000).length
    const lastAlert = alerts[0]
    return { total: ids.length, on, stale, off, zones: zones.size, rate: recent, lastAlert }
  }, [nodes, telemetry, alerts])

  const zoneList = useMemo(() => [...new Set(telemetry.map(s => s.zoneId))].sort(), [telemetry])

  const healthClass = stats.off > 0 ? 'bad' : stats.stale > 0 ? 'warn' : 'ok'
  const healthLabel = stats.off > 0 ? `${stats.off} nodos caídos` : stats.stale > 0 ? `${stats.stale} nodos lentos` : 'Red saludable'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>Red-SensUrb · Dashboard</h1>
            <small>{API_BASE} · {connected ? `actualizado ${lastTick?.toLocaleTimeString('es-AR')}` : 'sin conexión'}</small>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <span className={`status-pill ${connected ? '' : 'bad'}`}>
            <span className="dot" /> {connected ? 'COORDINATOR ONLINE' : 'OFFLINE'}
          </span>
          <span className={`status-pill ${healthClass === 'ok' ? '' : healthClass}`}>
            <span className="dot" /> {healthLabel}
          </span>
        </div>
      </header>

      <section className="kpis">
        <div className="kpi">
          <div className="label">Nodos</div>
          <div className="value">{stats.total}</div>
          <div className="sub">{stats.zones} zonas</div>
        </div>
        <div className="kpi">
          <div className="label">En línea</div>
          <div className="value ok">{stats.on}</div>
          <div className="sub">activos últimos 10s</div>
        </div>
        <div className="kpi">
          <div className="label">Lentos / caídos</div>
          <div className="value warn">{stats.stale} <span style={{color:'var(--muted)', fontSize:18}}>/</span> <span style={{color:'var(--danger)'}}>{stats.off}</span></div>
          <div className="sub">stale &gt; 10s · off &gt; 30s</div>
        </div>
        <div className="kpi">
          <div className="label">Muestras/min</div>
          <div className="value">{stats.rate}</div>
          <div className="sub">tasa de ingesta UDP</div>
        </div>
        <div className="kpi">
          <div className="label">Última alerta</div>
          <div className={`value ${stats.lastAlert ? 'bad' : 'ok'}`} style={{fontSize:18}}>
            {stats.lastAlert ? (stats.lastAlert.severity || 'ALERT') : '— ninguna —'}
          </div>
          <div className="sub">{stats.lastAlert?.zoneId || 'sin incidentes'}</div>
        </div>
      </section>

      <TimeSeriesChart samples={telemetry} />

      <section className="grid-2">
        <div>
          <NodesGrid nodes={nodes} samples={telemetry} />
          <MarkdownReport nodes={nodes} samples={telemetry} alerts={alerts} />
        </div>
        <div>
          <AlertsPanel alerts={alerts} />
          <AlertComposer zones={zoneList} />
        </div>
      </section>

      <footer style={{textAlign:'center', color:'var(--muted)', fontSize:11, padding:'12px 0 24px'}}>
        Red-SensUrb · UI gráfica · datos cada 2s · SVG render sin dependencias externas
      </footer>
    </div>
  )
}
