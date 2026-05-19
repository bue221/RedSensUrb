# Proposal — Red-SensUrb

## Change
Implement a distributed urban sensing platform with Java backend services and a React web client, deployable with Docker Compose for simulation.

## Objectives
- Ingest telemetry (temperature, humidity, CO2) from 3+ autonomous sensor nodes.
- Support synchronous/asynchronous process communication (TCP/UDP).
- Expose remote invocations with Java RMI.
- Publish REST + SOAP services (SOAP as simulated UDDI/service directory).
- Guarantee consistent critical alert replication with distributed transactions.
- Demonstrate basic fault tolerance, concurrency, and token-based auth.

## Technical Decisions (approved baseline)
1. **Backend stack**: Java 21 + Spring Boot 3 (REST, DI, scheduling, security).
2. **RMI**: native Java RMI for coordinator ↔ replicas critical operations.
3. **Transport split**:
   - UDP for sensor telemetry stream.
   - TCP for control commands and fault injection.
4. **Distributed transaction**: simplified 2PC for critical alert writes in replicas A/B.
5. **Persistence**:
   - Coordinator: PostgreSQL (history, node state, alerts index).
   - Replicas: lightweight local store (H2/file) for transactional simulation.
6. **Web services**:
   - REST for dashboard queries/actions.
   - SOAP endpoint for service directory/discovery metadata.
7. **Frontend**: React + Vite dashboard consuming coordinator REST API.
8. **Security**: static token/JWT-like shared token for protected endpoints.
9. **Simulation**: Docker Compose with independent containers per node/service.

## Architecture (high level)
- `sensor-node-x3`: sends telemetry over UDP, accepts TCP control.
- `coordinator` (layered):
  - presentation: REST + SOAP
  - business: ingest, alert rules, tx coordinator, liveness
  - data: repositories + historical querying
- `replica-a`, `replica-b`: RMI participants for 2PC prepare/commit/rollback.
- `web-client`: visualization and alert/audit views.

## Non-goals (to control scope)
- Full production-grade consensus (Raft/Paxos).
- Complex identity provider (OAuth/OIDC).
- Real IoT hardware integration.

## Acceptance Criteria
1. 3+ sensors concurrently send data; coordinator stores and serves history.
2. UDP ingestion and TCP control commands both operational.
3. RMI call path demonstrated in runtime logs.
4. SOAP directory endpoint reachable and returns service metadata.
5. Critical alert triggers 2PC across replicas with visible commit/rollback evidence.
6. Fault simulation (replica down / timeout) handled with degraded-mode behavior.
7. React dashboard shows live-ish telemetry, history, node health, and alerts.
8. Protected endpoints reject missing/invalid token.

## Risks and Mitigations
- **RMI + Spring complexity** → isolate RMI module and keep interface minimal.
- **Protocol debugging overhead** → structured logs + correlation id per alert tx.
- **Demo instability** → provide scripted startup order and health checks.

## Delivery Plan (macro)
1. Foundation: project scaffold + docker-compose + DB.
2. Sensor transport: UDP ingest + TCP control.
3. Coordinator API: REST history/status + token auth.
4. RMI replicas + 2PC implementation.
5. SOAP service directory.
6. React dashboard + integration tests + demo scripts.
