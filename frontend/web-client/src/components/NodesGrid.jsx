import React from 'react'
import Sparkline from './Sparkline'
import { nodeFreshness, fmtAge, thresholds, groupBySensor, colorForZone } from '../util'

export default function NodesGrid({ nodes, samples }) {
  const bySensor = groupBySensor(samples)
  const entries = Object.entries(nodes?.nodes || {})
  // also include sensors that appear in samples but not yet in nodes/status
  for (const sid of bySensor.keys()) {
    if (!entries.find(([k]) => k === sid)) {
      const arr = bySensor.get(sid)
      entries.push([sid, arr[arr.length - 1].timestamp])
    }
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <h3>Nodos</h3>
        <div style={{color:'var(--muted)', textAlign:'center', padding:'40px 0'}}>
          🛰️ Ningún nodo reportó todavía.<br />
          <small>Iniciá un <code>sensor-node</code> y aparecerá aquí en vivo.</small>
        </div>
      </div>
    )
  }

  const sorted = entries.sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="panel">
      <h3>Nodos <span className="badge">{sorted.length}</span></h3>
      <div className="nodes">
        {sorted.map(([sensorId, lastSeen], idx) => {
          const fresh = nodeFreshness(lastSeen)
          const samplesArr = bySensor.get(sensorId) || []
          const latest = samplesArr[samplesArr.length - 1]
          const zoneId = latest?.zoneId || '—'
          const tempSeries = samplesArr.slice(-30).map(s => s.temperatureC)
          const tClass = latest ? thresholds('temperatureC', latest.temperatureC) : 'ok'
          const hClass = latest ? thresholds('humidityPct',  latest.humidityPct)  : 'ok'
          const cClass = latest ? thresholds('co2Ppm',       latest.co2Ppm)       : 'ok'
          const color = colorForZone(zoneId, idx)
          return (
            <div className="node-card" key={sensorId}>
              <div className="node-head">
                <div>
                  <div className="node-id">{sensorId}</div>
                  <div className="node-zone">zona <b style={{color}}>{zoneId}</b></div>
                </div>
                <div className={`led ${fresh.state}`} title={fresh.state} />
              </div>

              <div className="node-metrics">
                <div className={`metric ${tClass}`}>
                  <div className="v">{latest ? latest.temperatureC.toFixed(1) : '—'}<small style={{fontSize:10}}>°C</small></div>
                  <div className="k">temp</div>
                </div>
                <div className={`metric ${hClass}`}>
                  <div className="v">{latest ? latest.humidityPct.toFixed(0) : '—'}<small style={{fontSize:10}}>%</small></div>
                  <div className="k">hum</div>
                </div>
                <div className={`metric ${cClass}`}>
                  <div className="v">{latest ? latest.co2Ppm : '—'}</div>
                  <div className="k">co₂</div>
                </div>
              </div>

              <div className="spark">
                <Sparkline values={tempSeries} width={200} height={36} color={color} />
              </div>

              <div className="node-foot">
                <span>↳ {samplesArr.length} muestras</span>
                <span>{fresh.state === 'on' ? '🟢 vivo' : fresh.state === 'stale' ? '🟡 lento' : '🔴 caído'} · {fmtAge(fresh.age)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
