# API del MVP

Base URL: `http://localhost:8080/api/v1`

## GET /nodes/status
Estado de nodos por último heartbeat.

## GET /telemetry?zoneId=&limit=
Histórico reciente de telemetría.

## GET /alerts?limit=
Transacciones críticas persistidas.

## POST /alerts/critical
Dispara 2PC distribuido.

Headers:
- `Authorization: Bearer changeme-token`
- `Content-Type: application/json`

Body ejemplo:
```json
{
  "zoneId": "zone-north",
  "metric": "co2Ppm",
  "value": 1400,
  "threshold": 1200,
  "severity": "CRITICAL",
  "source": "demo"
}
```
