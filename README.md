# Red-SensUrb

MVP distribuido (Java + React) para sensores urbanos.

## Qué ya funciona (MVP-1)
- 3 nodos sensor simulados (contenedores Java).
- Envío de telemetría por UDP al coordinator.
- API REST en coordinator:
  - `GET /api/v1/telemetry`
  - `GET /api/v1/nodes/status`
  - `POST /api/v1/alerts/critical` (2PC básico por RMI)
- Réplicas RMI (`replica-a`, `replica-b`) con `prepare/commit/rollback`.
- Web client React mostrando nodos y telemetría.
- Token básico para endpoint crítico.
- Persistencia SQLite para histórico y auditoría de alertas críticas.

## Estructura
- `backend/` (Maven multi-módulo)
- `frontend/web-client` (React + Vite)
- `deploy/docker-compose.yml`
- `openspec/` (SDD)

## Levantar MVP
```bash
docker compose -f deploy/docker-compose.yml up --build
```

## Probar
```bash
curl http://localhost:8080/api/v1/nodes/status
curl "http://localhost:8080/api/v1/telemetry?limit=5"
curl -X POST http://localhost:8080/api/v1/alerts/critical \
  -H "Authorization: Bearer changeme-token" \
  -H "Content-Type: application/json" \
  -d '{"zoneId":"zone-north","metric":"co2Ppm","value":1400,"threshold":1200,"severity":"CRITICAL","source":"demo"}'
curl "http://localhost:8080/api/v1/alerts?limit=10"
```

UI: `http://localhost:5173`

## Estudio
Ver carpeta `docs/` (índice: `docs/00-indice.md`).
