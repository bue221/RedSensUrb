export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

async function j(r) {
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  telemetry: (limit = 200) => fetch(`${API_BASE}/api/v1/telemetry?limit=${limit}`).then(j),
  nodes:     ()             => fetch(`${API_BASE}/api/v1/nodes/status`).then(j),
  alerts:    (limit = 50)   => fetch(`${API_BASE}/api/v1/alerts?limit=${limit}`).then(j),
  postCritical: (body, token) => fetch(`${API_BASE}/api/v1/alerts/critical`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  }).then(async r => {
    const text = await r.text()
    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
    return { ok: r.ok, status: r.status, body: parsed }
  })
}
