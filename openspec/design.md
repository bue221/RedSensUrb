# Design — Red-SensUrb

## 1. Logical Architecture

## 1.1 Services
1. **sensor-node** (multiple instances)
   - Generates telemetry periodically.
   - Sends UDP payloads to coordinator.
   - Exposes TCP control listener.

2. **coordinator**
   - Layered design:
     - **Presentation**: REST + SOAP endpoints.
     - **Application**: ingestion, alert rules, tx coordination.
     - **Domain**: telemetry, node status, alerts, transactions.
     - **Infrastructure**: repositories, RMI client, UDP server, auth filter.

3. **alert-replica-a / alert-replica-b**
   - Expose Java RMI participant interface.
   - Persist prepare state and final commit/rollback decision.

4. **web-client (React)**
   - Dashboard for telemetry, node health, alert history.

5. **postgres**
   - Persistent store for coordinator.

---

## 2. Module/Repo Structure

```text
redsensurb/
  backend/
    coordinator/
    replica/
    sensor-node/
    shared-contracts/
  frontend/
    web-client/
  deploy/
    docker-compose.yml
  docs/
```

### 2.1 shared-contracts
- DTOs for telemetry, alerts, tx audit.
- RMI interfaces and serializable request/response objects.

### 2.2 coordinator
- `api/rest` controllers
- `api/soap` endpoints
- `app/ingestion` UDP parsing and validation
- `app/control` node control orchestration metadata
- `app/tx` 2PC coordinator service
- `infra/rmi` replica stubs and adapter
- `infra/persistence` JPA repositories
- `security` token filter/interceptor

### 2.3 replica
- RMI registry bootstrap
- `ParticipantService` implementing prepare/commit/rollback
- local storage for tx state

### 2.4 sensor-node
- telemetry scheduler
- UDP sender
- TCP command server
- fault injection toggles

---

## 3. Key Interfaces

### 3.1 RMI Participant Interface
```java
public interface AlertParticipant extends Remote {
  PrepareResult prepare(AlertTxRequest request) throws RemoteException;
  CommitResult commit(String txId) throws RemoteException;
  RollbackResult rollback(String txId) throws RemoteException;
  HealthResult health() throws RemoteException;
}
```

### 3.2 2PC Coordinator Contract
```java
public interface CriticalAlertTxCoordinator {
  TxOutcome executeCriticalAlert(CriticalAlertRequest request);
}
```

### 3.3 UDP Telemetry Decoder
```java
public interface TelemetryDecoder {
  TelemetrySample decode(byte[] datagramPayload);
}
```

---

## 4. Sequence Designs

### 4.1 Telemetry Ingestion
1. Sensor scheduler emits sample.
2. Sensor sends UDP datagram to coordinator.
3. Coordinator UDP listener decodes and validates.
4. Coordinator persists telemetry and updates node heartbeat.
5. REST queries can fetch latest/historical data.

### 4.2 Critical Alert (2PC)
1. Client POST `/alerts/critical` (token).
2. Coordinator creates `txId` + audit record (`STARTED`).
3. Coordinator sends `prepare(txId, alert)` to replica A and B (parallel calls, timeout).
4. If both vote YES → send `commit(txId)` to all; audit `COMMITTED`.
5. If any NO/timeout/error → send `rollback(txId)` to all; audit `ROLLED_BACK`.
6. API returns success/failure with `txId`.

### 4.3 SOAP Directory
1. Coordinator registers service metadata on startup.
2. SOAP client calls `listServices()`.
3. Directory returns protocol + endpoint + health URL entries.

---

## 5. Data Design

### 5.1 Coordinator tables
- `telemetry_samples(id, sensor_id, zone_id, ts, temperature_c, humidity_pct, co2_ppm)`
- `node_status(sensor_id, last_seen, state, rate_ms, fault_mode)`
- `alerts(id, zone_id, metric, value, threshold, severity, source, created_at)`
- `alert_transactions(tx_id, alert_id, phase, decision, created_at, updated_at, error)`
- `alert_transaction_votes(id, tx_id, replica_id, vote, latency_ms, error)`

### 5.2 Replica local state
- `prepared_transactions(tx_id, payload_hash, prepared_at, status)`

---

## 6. Concurrency Model
- Coordinator UDP listener runs on dedicated IO thread(s).
- Telemetry persistence processed via bounded executor.
- 2PC coordinator uses request-scoped transaction context.
- RMI prepare calls executed concurrently with timeout futures.

---

## 7. Fault Tolerance Strategy
- Configurable timeouts for RMI prepare/commit/rollback.
- Retry policy: at most N retries for commit/rollback delivery.
- Idempotent commit/rollback in replicas by `txId`.
- Degraded mode flag when replica health fails.

---

## 8. Security Design
- Spring filter checks `Authorization: Bearer <token>` for protected routes.
- Token stored in env var `API_TOKEN`.
- Public read routes optional via configuration profile.

---

## 9. Docker Compose Topology
- Network: `redsensurb-net`
- Coordinator ports: REST, SOAP, UDP ingest, optional TCP admin
- Sensor containers: each has TCP command port
- Replicas: RMI registry/remote object port exposed internally
- Postgres: internal + optional mapped port for debugging
- React client: served on `:5173` or nginx static `:8080`

---

## 10. Implementation Phasing
1. Scaffold modules + shared contracts.
2. Implement sensor UDP + TCP control.
3. Implement coordinator ingestion + REST history.
4. Implement RMI replica + 2PC coordinator.
5. Implement SOAP directory.
6. Implement React dashboard.
7. Add fault scripts, integration tests, and demo runbook.

---

## 11. Design Constraints
- Keep contracts in English.
- Keep tx logs explicit for demo explainability.
- Avoid over-engineering (no full consensus protocol).
