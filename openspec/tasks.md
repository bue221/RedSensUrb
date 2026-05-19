# Tasks — Red-SensUrb

## T0. Project Bootstrap
- [ ] Create monorepo/module structure:
  - `backend/coordinator`
  - `backend/replica`
  - `backend/sensor-node`
  - `backend/shared-contracts`
  - `frontend/web-client`
  - `deploy/`
- [ ] Add root README with architecture summary and startup order.
- [ ] Define environment variables template (`.env.example`).

**DoD:** project builds locally; folder structure stable.

---

## T1. Shared Contracts (Java)
- [ ] Define DTOs for telemetry, alerts, tx audit in `shared-contracts`.
- [ ] Define RMI interfaces and serializable responses.
- [ ] Version contracts package (`v1`) for compatibility.

**DoD:** coordinator/replica/sensor import shared contracts without duplication.

---

## T2. Sensor Node Service
- [ ] Implement periodic telemetry generator.
- [ ] Implement UDP sender to coordinator ingest port.
- [ ] Implement TCP command listener (`START`, `STOP`, `SET_RATE`, `INJECT_FAULT`, `STATUS`).
- [ ] Add fault injection modes (`NETWORK_DROP`, `DELAY`).
- [ ] Add structured logging (`sensorId`, `zoneId`).

**DoD:** manual TCP commands alter runtime behavior; UDP messages emitted.

---

## T3. Coordinator Core Ingestion
- [ ] Implement UDP server listener.
- [ ] Decode/validate telemetry JSON payload.
- [ ] Persist telemetry sample into PostgreSQL.
- [ ] Track node heartbeat/status updates.
- [ ] Add REST endpoint `GET /api/v1/nodes/status`.

**DoD:** 3 sensor containers ingest concurrently and status is queryable.

---

## T4. REST API (Coordinator)
- [ ] Implement `GET /api/v1/telemetry` with filters (zone/from/to/limit).
- [ ] Implement `GET /api/v1/alerts`.
- [ ] Implement `POST /api/v1/alerts/critical` (stub tx response first).
- [ ] Add request validation and consistent error envelope.

**DoD:** endpoints return expected payloads and HTTP semantics.

---

## T5. Security (Token)
- [ ] Implement auth filter/interceptor for protected endpoints.
- [ ] Configure token via env (`API_TOKEN`).
- [ ] Return `401` for missing/invalid token.
- [ ] Document public vs protected endpoints.

**DoD:** protected actions require valid bearer token.

---

## T6. Replica Service + RMI
- [ ] Implement RMI participant server bootstrap.
- [ ] Implement `prepare/commit/rollback/health` methods.
- [ ] Persist local tx state for idempotence by `txId`.
- [ ] Add startup registration/health logs.

**DoD:** coordinator can invoke both replicas remotely through RMI.

---

## T7. Distributed Transaction (2PC)
- [ ] Implement coordinator tx orchestrator for critical alerts.
- [ ] Parallel prepare calls with timeout handling.
- [ ] Commit-all on unanimous YES.
- [ ] Rollback-all on any NO/timeout/error.
- [ ] Persist tx audit and replica votes.
- [ ] Return API response with `txId` and decision.

**DoD:** no partial commit under defined fault scenarios.

---

## T8. SOAP Directory (UDDI-like)
- [ ] Implement SOAP endpoint for `registerService`, `listServices`, `getService`.
- [ ] Register coordinator services at startup.
- [ ] Provide sample SOAP request/response in docs.

**DoD:** SOAP client can discover service metadata.

---

## T9. React Web Client
- [ ] Setup React + Vite app.
- [ ] Implement views:
  - telemetry dashboard
  - historical filters
  - node status
  - critical alerts + tx outcome
- [ ] Add API client with token support.
- [ ] Add basic error/loading states.

**DoD:** UI demonstrates core workflows end-to-end.

---

## T10. Docker Compose Simulation
- [ ] Create `deploy/docker-compose.yml` with:
  - coordinator, replica-a, replica-b, sensor-1..3, postgres, web-client
- [ ] Configure shared network and env vars.
- [ ] Define health checks and startup dependencies.
- [ ] Add `make up/down/logs` scripts (optional).

**DoD:** one-command startup runs full simulated environment.

---

## T11. Fault-Injection and Validation
- [ ] Script/scenario: replica timeout during prepare.
- [ ] Script/scenario: replica down before commit.
- [ ] Script/scenario: UDP packet drop.
- [ ] Script/scenario: sensor stop/restart via TCP.
- [ ] Capture expected logs and API outcomes.

**DoD:** all failure model cases from spec are reproducible.

---

## T12. Testing
- [ ] Unit tests: decoder, validators, tx decision logic.
- [ ] Integration tests: REST + DB + RMI (or controlled test doubles).
- [ ] End-to-end smoke test in docker compose.

**DoD:** test report demonstrates baseline reliability.

---

## T13. Documentation and Delivery
- [ ] Design document with diagrams (layers, interactions, failure model).
- [ ] Operation manual (startup, fault simulation, transaction run).
- [ ] Demo video script (concurrency + fault tolerance + RMI + web services).
- [ ] Slide deck (<=10 slides) aligned with workshop rubric.

**DoD:** all deliverables of workshop checklist completed.

---

## Suggested Execution Order
`T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13`

## Review Workload Forecast
- Estimated total diff: large (>500 lines).
- Strategy selected in preflight: `single-pr-default`.
- Recommendation: keep commits as work units per task (T2/T3/T7/T9 especially).
