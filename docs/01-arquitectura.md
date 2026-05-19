# Arquitectura general

## Diagrama de componentes

```mermaid
flowchart LR
  subgraph Sensores
    S1[sensor-1]
    S2[sensor-2]
    S3[sensor-3]
  end

  subgraph Coordinator
    UDP[UDP Ingest]
    REST[REST API + Token]
    TX[2PC Coordinator]
    DB[(SQLite)]
  end

  subgraph Replicas
    RA[replica-a RMI]
    RB[replica-b RMI]
  end

  WEB[React Web Client]
  USER[Operador / curl]

  S1 & S2 & S3 -- UDP --> UDP --> DB
  WEB --> REST
  USER --> REST
  REST --> DB
  REST --> TX
  TX -- RMI --> RA
  TX -- RMI --> RB
```

## Diagrama de capas (coordinator)

```mermaid
flowchart TB
  P[Presentación<br/>REST Controller + TokenFilter]
  A[Aplicación<br/>TxCoordinatorService, UdpIngestService]
  D[Dominio / Contratos<br/>shared-contracts]
  I[Infra<br/>JdbcTemplate, RMI Naming.lookup]
  S[(SQLite)]
  R[(RMI Replicas)]

  P --> A --> D
  A --> I
  I --> S
  I --> R
```


## Componentes
- **sensor-1/2/3 (Java):** generan telemetría y la envían por UDP.
- **coordinator (Java Spring Boot):** recibe telemetría, persiste en SQLite, expone REST y coordina transacciones 2PC por RMI.
- **replica-a / replica-b (Java RMI):** participan de `prepare/commit/rollback`.
- **web-client (React):** muestra nodos y telemetría.

## Protocolos
- **UDP:** sensor -> coordinator (datos ambientales).
- **RMI:** coordinator <-> replicas (transacción crítica distribuida).
- **HTTP REST:** cliente/web/curl -> coordinator.

## Persistencia
- **SQLite en coordinator** (`/data/redsensurb.db` en Docker volume).
- Tablas:
  - `telemetry_samples`
  - `alert_transactions`
