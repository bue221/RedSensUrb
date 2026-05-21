# Code Context

## Files Retrieved

1. `backend/sensor-node/src/main/java/com/redsensurb/sensor/SensorApplication.java` (lines 17-73) - sensor runtime: UDP telemetry sender + TCP control server + fault injection.
2. `backend/coordinator/src/main/java/com/redsensurb/coordinator/udp/UdpIngestService.java` (lines 29-46) - coordinator UDP listener loop: receive → JSON parse → persist → heartbeat.
3. `backend/coordinator/src/main/java/com/redsensurb/coordinator/core/TelemetryRepository.java` (lines 16-34) - telemetry persistence/query against SQLite (`telemetry_samples`).
4. `backend/coordinator/src/main/resources/schema.sql` (lines 1-21) - DB schema for `telemetry_samples` + `alert_transactions`.
5. `backend/coordinator/src/main/java/com/redsensurb/coordinator/core/InMemoryStore.java` (lines 11-15) - in-memory heartbeat map used by `/nodes/status`.
6. `backend/coordinator/src/main/java/com/redsensurb/coordinator/api/CoordinatorController.java` (lines 30-46) - REST endpoints: telemetry, node status, alerts, critical alert.
7. `backend/coordinator/src/main/java/com/redsensurb/coordinator/security/TokenFilter.java` (lines 17-38) - auth gate for `POST /api/v1/alerts/critical`.
8. `backend/coordinator/src/main/java/com/redsensurb/coordinator/core/TxCoordinatorService.java` (lines 23-55) - 2PC coordinator: RMI lookup → prepare votes → commit/rollback → audit.
9. `backend/shared-contracts/src/main/java/com/redsensurb/rmi/AlertParticipant.java` (lines 9-13) - RMI participant interface (prepare/commit/rollback/health).
10. `backend/replica/src/main/java/com/redsensurb/replica/ReplicaApplication.java` (lines 7-21) - replica process: create/get RMI registry + `rebind()` participant.
11. `backend/replica/src/main/java/com/redsensurb/replica/AlertParticipantImpl.java` (lines 21-42) - replica participant implementation; in-memory tx state.
12. `backend/shared-contracts/src/main/java/com/redsensurb/contracts/TelemetrySample.java` (line 6) - telemetry “schema” (record fields).
13. `backend/shared-contracts/src/main/java/com/redsensurb/contracts/CriticalAlertRequest.java` (line 5) - critical alert request payload.
14. `backend/shared-contracts/src/main/java/com/redsensurb/contracts/AlertTxRequest.java` (line 5) - wrapper for RMI prepare.
15. `backend/shared-contracts/src/main/java/com/redsensurb/contracts/TxOutcome.java` (line 6) - 2PC outcome returned by API.
16. `backend/shared-contracts/src/main/java/com/redsensurb/contracts/TxVote.java` (line 5) - vote/response structure.
17. `backend/coordinator/src/main/resources/application.properties` (lines 1-7) - coordinator ports + UDP port + SQLite path + API token.

## Key Code

### UDP telemetry runtime flow (step-by-step)

1. **Sensor process boot** — `com.redsensurb.sensor.SensorApplication#main` (SensorApplication.java:17-28)
   - Reads env: `SENSOR_ID`, `ZONE_ID`, `COORDINATOR_HOST`, `COORDINATOR_UDP_PORT`, `SENSOR_TCP_PORT`.
   - Starts a TCP control server: `startControlServer(tcpPort)`.
   - Starts a single-thread scheduler: `scheduleWithFixedDelay(() -> sendTelemetry(...), 0, 1, TimeUnit.SECONDS)`.

2. **TCP control server accepts commands** — `startControlServer` (SensorApplication.java:48-63) + `handleCommand` (65-73)
   - Commands: `START`, `STOP`, `SET_RATE <ms>`, `INJECT_FAULT <NONE|NETWORK_DROP|DELAY>`, `STATUS`.
   - Effect is purely local (toggles `running`, `rateMs`, `fault`).

3. **Sensor sends one UDP datagram containing JSON** — `sendTelemetry` (SensorApplication.java:31-45)
   - Optionally drops/delays telemetry based on `fault`.
   - Creates a JSON string manually (no schema validation):
     ```java
     String json = String.format("{\"sensorId\":...}", ... Instant.now(), ...);
     socket.send(new DatagramPacket(bytes, bytes.length, InetAddress.getByName(host), port));
     ```
   - Sleeps `rateMs` _inside_ `sendTelemetry` (line 42). Combined with the scheduler’s fixed-delay of 1s (line 27), the **effective period is ~`rateMs + 1s`** (default `2000ms + 1s`).

4. **Coordinator UDP ingest loop receives datagrams** — `com.redsensurb.coordinator.udp.UdpIngestService#start` (UdpIngestService.java:29-46)
   - Spring `@PostConstruct` spawns a **virtual thread** (line 31).
   - Binds a `DatagramSocket` on `${app.udp.port}` (line 32).
   - For each packet (lines 35-41):
     ```java
     server.receive(packet);
     String json = new String(packet.getData(), 0, packet.getLength(), UTF_8);
     TelemetrySample sample = objectMapper.readValue(json, TelemetrySample.class);
     telemetryRepository.save(sample);
     store.nodeLastSeen.put(sample.sensorId(), sample.timestamp());
     ```

5. **Coordinator persists telemetry to SQLite** — `TelemetryRepository#save` (TelemetryRepository.java:16-19)
   - Inserts into `telemetry_samples(sensor_id, zone_id, ts, temperature_c, humidity_pct, co2_ppm)`.
   - Schema defined at `backend/coordinator/src/main/resources/schema.sql` (lines 1-9).

6. **Coordinator exposes read APIs** — `CoordinatorController` (CoordinatorController.java:30-46)
   - `GET /api/v1/telemetry` → `TelemetryRepository#find` (TelemetryRepository.java:21-34) returning newest by `id DESC`.
   - `GET /api/v1/nodes/status` → returns `store.nodeLastSeen` map (CoordinatorController.java:35-36).

### UDP guarantees vs. what the code assumes (and current handling)

**What UDP does guarantee (per datagram):**

- Message boundaries are preserved (one `send()` = one datagram = one `receive()`), _if_ the datagram arrives unfragmented.
- Payload is delivered intact _or not at all_ (checksum), but delivery is best-effort.

**What UDP does NOT guarantee:**

- Delivery (packet loss is normal).
- Ordering (packets can arrive out of order).
- Uniqueness (duplicates can occur).
- Congestion control/backpressure (sender can overwhelm receiver/network).

**How this repo handles (or doesn’t handle) loss/ordering/duplication:**

- **No ACK/retry**: `SensorApplication` never waits for confirmation; `UdpIngestService` never responds.
- **No sequencing/dedup**: `TelemetrySample` has no monotonic sequence; `TelemetryRepository#save` writes every sample it receives.
- **Ordering is “arrival order”** in the UI/API: queries use `ORDER BY id DESC` (TelemetryRepository.java:22-24), so delayed packets can appear “newer” than earlier measurements.
- **Heartbeat map is last-writer-wins**: `nodeLastSeen.put(sensorId, timestamp)` (UdpIngestService.java:40) will happily move _backwards in time_ if an older delayed packet arrives late.
- **Fixed receive buffer (4096 bytes)**: packets larger than 4096 bytes risk truncation (UdpIngestService.java:33-37). Current sensor JSON is small, but schema growth could break ingest.
- **Failure mode on bad JSON**: any parse exception bubbles out and kills the ingest thread via `throw new RuntimeException(e)` (UdpIngestService.java:42-44).

### 2PC critical-alert runtime flow (step-by-step)

1. **Client calls critical alert endpoint** — `POST /api/v1/alerts/critical` (CoordinatorController.java:43-46)
   - Request body: `CriticalAlertRequest(zoneId, metric, value, threshold, severity, source)` (CriticalAlertRequest.java:5).

2. **Auth gate (token)** — `TokenFilter#doFilter` (TokenFilter.java:17-38)
   - Only applies to `POST .../api/v1/alerts/critical` (line 20).
   - Requires `Authorization: Bearer <token>` where `<token>` is `${app.api.token}` (application.properties:3).

3. **Coordinator begins a 2PC transaction** — `TxCoordinatorService#run2pc` (TxCoordinatorService.java:23-55)
   - Generates `txId = UUID.randomUUID()` (line 24).
   - Builds two RMI endpoints from env `RMI_REPLICA_A/B` with defaults:
     - `rmi://replica-a:1099/replica-a`
     - `rmi://replica-b:1099/replica-b` (lines 25-28)

4. **Phase 1 (prepare/vote)** — `AlertParticipant#prepare` (AlertParticipant.java:10)
   - For each endpoint, does `Naming.lookup(endpoint)` and calls:
     ```java
     p.prepare(new AlertTxRequest(txId, request));
     ```
     (TxCoordinatorService.java:34-37)
   - If any lookup/call fails, `allPrepared` becomes `false` and a failed `TxVote` is recorded (lines 38-41).

5. **Decision** — `COMMIT` iff all participants prepared successfully (TxCoordinatorService.java:44)

6. **Phase 2 (finalize)** — `commit(txId)` or `rollback(txId)` (TxCoordinatorService.java:45-52)
   - Still re-does `Naming.lookup` per endpoint (line 47), then calls `commit` or `rollback` (line 48).
   - Errors in finalize are recorded, but **do not change** the already-chosen decision.

7. **Audit trail persistence** — `AlertTxRepository#save` (AlertTxRepository.java:17-20)
   - Always inserts a row into `alert_transactions` with the final decision.
   - Schema is in `schema.sql` (lines 11-21). Note: this table stores the **2PC outcome**, not replica state.

8. **Replica participant behavior** — `AlertParticipantImpl` (AlertParticipantImpl.java:21-42)
   - `prepare`: `txState.put(txId, "PREPARED")` and always returns OK (lines 22-25).
   - `commit`/`rollback`: simply set `txState` to `COMMITTED`/`ROLLED_BACK` and return OK (lines 28-37).
   - State is **in-memory only**; a replica restart forgets all transactions.

9. **Replica binding / addressing** — `ReplicaApplication#main` (ReplicaApplication.java:7-21)
   - Starts or connects to an RMI registry on `RMI_REGISTRY_PORT` (default 1099).
   - `registry.rebind(bindName, new AlertParticipantImpl(replicaId))` (line 19).
   - `bindName` defaults to `replicaId` (line 10), matching coordinator defaults (`.../replica-a`, `.../replica-b`).

## Architecture

- **UDP telemetry plane (unreliable, high-rate):** sensor nodes send one JSON datagram per sample to coordinator UDP port; coordinator does best-effort ingest and persistence.
- **HTTP control plane (reliable request/response):** coordinator exposes REST endpoints for UI/clients: telemetry readout, node status, alert audit list, critical alert initiation.
- **RMI replication plane for critical alerts (2PC):** coordinator coordinates an atomic commit decision across two replicas.

Data stores:

- Coordinator persists to SQLite via Spring `JdbcTemplate`.
- Replicas do _not_ persist state (in-memory map only).

## Start Here

1. `backend/coordinator/src/main/java/com/redsensurb/coordinator/udp/UdpIngestService.java` - single entry-point for all UDP telemetry ingest semantics.
2. `backend/sensor-node/src/main/java/com/redsensurb/sensor/SensorApplication.java` - shows exactly what telemetry format is sent and what failure is simulated.
3. `backend/coordinator/src/main/java/com/redsensurb/coordinator/core/TxCoordinatorService.java` - the full 2PC algorithm used for critical alerts.

## Why 2PC matters here (and what failure modes it addresses)

**Intent in this repo:** a “critical alert” should be treated as a **distributed state change** across multiple replicas; 2PC enforces **atomicity**: either all replicas accept the alert (COMMIT) or none do (ROLLBACK).

**Failure modes 2PC is meant to address (conceptually):**

- _Partial writes / split-brain_ where one replica records the alert and the other doesn’t (client sees inconsistent alert status depending on which replica is queried).
- _Coordinator-side uncertainty_ when one participant is unreachable: by voting/prepare phase, coordinator can choose to rollback rather than risk divergence.

**Important limitations of the current code (read before relying on it):**

- Participants always vote OK and keep only an in-memory `txState`; there’s no durable prepare log → doesn’t survive crash/restart.
- Coordinator doesn’t persist the decision before finalizing; if the coordinator crashes after some commits, it can’t recover and drive the remaining participants to the same decision.
- The returned `TxOutcome.votes` list mixes **prepare votes and finalize responses** into one list (TxCoordinatorService.java:29-55), which may be confusing for API consumers.

## Supervisor coordination

Not needed (repo reading only; no ambiguous product/API decisions required).
