# Specification — Red-SensUrb

## 1. System Context
Red-SensUrb is a distributed simulation of urban environmental sensing with Java services and a React client.

Actors:
- Sensor Node (autonomous)
- Coordinator (central orchestrator)
- Alert Replicas (A/B)
- Web Client (citizen/authority)
- Operator (control/fault simulation)

## 2. Functional Requirements

### FR-1 Telemetry Ingestion
- The system shall ingest telemetry from at least 3 sensor nodes.
- Telemetry payload fields:
  - `sensorId` (string)
  - `zoneId` (string)
  - `timestamp` (ISO-8601)
  - `temperatureC` (number)
  - `humidityPct` (number)
  - `co2Ppm` (number)
- Transport: UDP datagrams to coordinator ingest port.

### FR-2 Control Channel
- The system shall expose a TCP command port per sensor node.
- Supported commands:
  - `START`
  - `STOP`
  - `SET_RATE <ms>`
  - `INJECT_FAULT <type>` (e.g. `NETWORK_DROP`, `DELAY`)
  - `STATUS`
- Responses must include command result and timestamp.

### FR-3 Historical and Operational Query APIs (REST)
Coordinator REST endpoints:
- `GET /api/v1/telemetry?zoneId=&from=&to=&limit=`
- `GET /api/v1/nodes/status`
- `GET /api/v1/alerts?severity=&from=&to=`
- `POST /api/v1/alerts/critical` (protected; triggers 2PC)

### FR-4 Remote Invocation (RMI)
- Coordinator shall call replica participants via Java RMI.
- Replica interface methods:
  - `prepare(alertTx): PrepareResult`
  - `commit(txId): CommitResult`
  - `rollback(txId): RollbackResult`
  - `health(): HealthResult`

### FR-5 SOAP Service Directory (UDDI-like)
SOAP endpoint (coordinator):
- `registerService(name, protocol, endpointUrl, healthUrl)`
- `listServices()`
- `getService(name)`
Used for simulated discovery metadata only.

### FR-6 Distributed Transaction for Critical Alerts
- Critical alert registration must use simplified two-phase commit (2PC) across replicas A/B.
- Phase 1 (prepare): both replicas must acknowledge prepare within timeout.
- Phase 2:
  - if all prepared: commit all
  - otherwise: rollback all
- Coordinator must persist transaction audit trail.

### FR-7 Fault Tolerance and Concurrency
- The system shall handle concurrent ingestion from 3+ sensors.
- The system shall tolerate one replica failure during critical alert transaction by failing safe (rollback + error or configured degraded policy).
- Timeouts and retries shall be configurable.

### FR-8 Security (Basic Token)
- Protected endpoints require `Authorization: Bearer <token>`.
- Invalid/missing token must return `401`.

## 3. Non-Functional Requirements
- NFR-1 Availability for demo: startup script + health checks.
- NFR-2 Observability: structured logs with `txId`, `sensorId`, `zoneId`.
- NFR-3 Scalability (basic): support adding more sensor containers without code changes.
- NFR-4 Portability: run entire simulation via Docker Compose.

## 4. Data Contracts

### 4.1 UDP Telemetry JSON
```json
{
  "sensorId": "sensor-1",
  "zoneId": "zone-north",
  "timestamp": "2026-05-19T12:00:00Z",
  "temperatureC": 27.3,
  "humidityPct": 54.2,
  "co2Ppm": 702
}
```

### 4.2 Critical Alert Request (REST)
```json
{
  "zoneId": "zone-north",
  "metric": "co2Ppm",
  "value": 1450,
  "threshold": 1200,
  "severity": "CRITICAL",
  "source": "rule-engine"
}
```

### 4.3 Transaction Audit Record
Fields:
- `txId`, `alertId`, `createdAt`, `phase`, `replicaVotes`, `finalDecision`, `error`

## 5. Failure Model (Must Demonstrate)
- F-1 Replica timeout during prepare.
- F-2 Replica unavailable before commit.
- F-3 UDP packet loss (simulated) and coordinator resilience.
- F-4 Sensor process stop/restart via TCP control.

Expected behavior:
- System logs clear transaction outcome.
- No partial committed critical alert across replicas.

## 6. API Response Semantics
- Success: `200/201` with payload.
- Validation error: `400`.
- Unauthorized: `401`.
- Transaction conflict/failure: `409` or `503` (documented per endpoint).

## 7. Deployment Specification (Docker Compose)
Services:
- `coordinator`
- `sensor-1`, `sensor-2`, `sensor-3`
- `replica-a`, `replica-b`
- `postgres`
- `web-client`

Each service shall expose health endpoint or process-level readiness logs.

## 8. Test/Validation Criteria
- VC-1 3 sensors produce concurrent telemetry visible via REST query.
- VC-2 TCP control modifies sensor behavior at runtime.
- VC-3 RMI prepare/commit/rollback path is executed and logged.
- VC-4 SOAP directory returns registered service metadata.
- VC-5 Fault scenarios F-1..F-4 are reproducible with documented steps.
- VC-6 React UI reflects node status, telemetry, and alert outcomes.
