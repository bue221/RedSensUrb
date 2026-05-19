# Flujos clave

## Ingesta de telemetría

```mermaid
sequenceDiagram
  participant S as Sensor
  participant U as UdpIngestService
  participant R as TelemetryRepository
  participant DB as SQLite

  S->>U: DatagramPacket JSON
  U->>U: parse + validate
  U->>R: save(sample)
  R->>DB: INSERT telemetry_samples
```

## Estado de nodos

```mermaid
flowchart LR
  U[UDP Ingest] -- actualiza --> M[InMemoryStore.nodeLastSeen]
  C[GET /nodes/status] --> M
```

## Alerta crítica con 2PC

```mermaid
sequenceDiagram
  participant Cli as Cliente
  participant API as Coordinator
  participant TX as TxCoordinatorService
  participant RA as replica-a
  participant RB as replica-b
  participant DB as SQLite

  Cli->>API: POST /alerts/critical
  API->>TX: run2pc(req)
  TX->>RA: prepare
  TX->>RB: prepare
  alt todos OK
    TX->>RA: commit
    TX->>RB: commit
  else alguno falla
    TX->>RA: rollback
    TX->>RB: rollback
  end
  TX->>DB: INSERT alert_transactions
  TX-->>API: TxOutcome
  API-->>Cli: JSON
```


## 1) Ingesta de telemetría
1. Sensor genera JSON con temp/humedad/co2.
2. Lo manda por UDP al puerto del coordinator.
3. Coordinator parsea JSON y guarda en SQLite.
4. `GET /api/v1/telemetry` devuelve histórico.

## 2) Estado de nodos
1. Cada muestra actualiza `lastSeen` del sensor.
2. `GET /api/v1/nodes/status` muestra heartbeat por nodo.

## 3) Alerta crítica (2PC)
1. Cliente hace `POST /api/v1/alerts/critical` con token.
2. Coordinator crea `txId`.
3. Llama `prepare(txId, alert)` en replica-a y replica-b.
4. Si ambas responden OK -> `commit` en ambas.
5. Si alguna falla -> `rollback` en ambas.
6. Coordinator guarda resultado en SQLite (`alert_transactions`).
