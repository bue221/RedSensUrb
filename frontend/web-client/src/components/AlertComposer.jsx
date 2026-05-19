import React, { useState, useEffect } from 'react'
import { api } from '../api'

const STORAGE_KEY = 'redsensurb.api.token'

export default function AlertComposer({ zones }) {
  const [token, setToken]       = useState(() => localStorage.getItem(STORAGE_KEY) || 'changeme-token')
  const [zoneId, setZoneId]     = useState('zone-1')
  const [metric, setMetric]     = useState('temperatureC')
  const [value, setValue]       = useState(45)
  const [threshold, setThr]     = useState(40)
  const [severity, setSeverity] = useState('CRITICAL')
  const [source, setSource]     = useState('web-ui')
  const [busy, setBusy]         = useState(false)
  const [result, setResult]     = useState(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, token) }, [token])
  useEffect(() => {
    if (zones && zones.length && !zones.includes(zoneId)) setZoneId(zones[0])
  }, [zones])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.postCritical({
        zoneId, metric, value: Number(value), threshold: Number(threshold), severity, source
      }, token)
      setResult(res)
    } catch (err) {
      setResult({ ok: false, status: 0, body: { error: String(err) }})
    } finally { setBusy(false) }
  }

  return (
    <div className="panel">
      <h3>Disparar alerta crítica (2PC)</h3>
      <form className="composer" onSubmit={submit}>
        <div className="col-2">
          <label>Zona</label>
          <input value={zoneId} onChange={e => setZoneId(e.target.value)} list="zones-dl" />
          <datalist id="zones-dl">
            {(zones || []).map(z => <option key={z} value={z} />)}
          </datalist>
        </div>
        <div className="col-2">
          <label>Métrica</label>
          <select value={metric} onChange={e => setMetric(e.target.value)}>
            <option value="temperatureC">temperatureC</option>
            <option value="humidityPct">humidityPct</option>
            <option value="co2Ppm">co2Ppm</option>
          </select>
        </div>
        <div>
          <label>Valor</label>
          <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div>
          <label>Umbral</label>
          <input type="number" step="0.1" value={threshold} onChange={e => setThr(e.target.value)} />
        </div>
        <div className="col-2">
          <label>Severidad</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)}>
            <option>CRITICAL</option><option>WARNING</option><option>INFO</option>
          </select>
        </div>
        <div className="col-2">
          <label>Origen</label>
          <input value={source} onChange={e => setSource(e.target.value)} />
        </div>
        <div className="col-2">
          <label>Token Bearer</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="changeme-token" />
        </div>
        <div className="col-6" style={{display:'flex', justifyContent:'flex-end'}}>
          <button type="submit" disabled={busy}>{busy ? 'Enviando…' : '🚨 Disparar alerta'}</button>
        </div>
      </form>

      {result && (
        <pre className={`tx-result ${result.ok ? 'ok' : 'bad'}`}>
{`HTTP ${result.status}
${JSON.stringify(result.body, null, 2)}`}
        </pre>
      )}
    </div>
  )
}
