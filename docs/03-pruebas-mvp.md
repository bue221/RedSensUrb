# Cómo levantar y probar el MVP

## 1) Levantar servicios backend distribuidos
```bash
docker-compose -f deploy/docker-compose.yml up --build -d coordinator replica-a replica-b sensor-1 sensor-2 sensor-3
```

## 2) Verificar estado
```bash
docker-compose -f deploy/docker-compose.yml ps
curl http://localhost:8080/api/v1/nodes/status
```

## 3) Ver telemetría
```bash
curl "http://localhost:8080/api/v1/telemetry?limit=5"
```

## 4) Probar transacción distribuida 2PC
```bash
curl -X POST http://localhost:8080/api/v1/alerts/critical \
  -H "Authorization: Bearer changeme-token" \
  -H "Content-Type: application/json" \
  -d '{"zoneId":"zone-north","metric":"co2Ppm","value":1400,"threshold":1200,"severity":"CRITICAL","source":"demo"}'
```

## 5) Ver auditoría persistida
```bash
curl "http://localhost:8080/api/v1/alerts?limit=10"
```

## 6) Frontend (opcional)
```bash
docker-compose -f deploy/docker-compose.yml up --build web-client
```
Si falla por red npm (`EAI_AGAIN`), no afecta backend MVP.
