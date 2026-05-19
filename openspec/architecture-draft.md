# Red-SensUrb Architecture Draft

## Scope
Distributed system for urban environmental sensing with Java services and React web client.

## Components
- `sensor-node` (x3+): Java processes generating Temp/Humidity/CO2 telemetry.
- `coordinator`: Java central service with layered architecture:
  - Presentation: REST + SOAP endpoints
  - Business: ingestion, alerting, orchestration
  - Data: time-series/history + alert state
- `alert-replica-a`, `alert-replica-b`: Java replicated alert stores.
- `rmi-registry` + RMI interfaces for remote coordinator/replica operations.
- `web-client`: React dashboard for citizens/authorities.

## Communication Model
- UDP: sensor telemetry broadcast to coordinator.
- TCP: control channel (start/stop/calibration/fault injection).
- Java RMI: remote invocation for replicated alert writes and coordination ops.
- REST: historical queries, node status, alert browsing.
- SOAP (UDDI-like): simulated service directory + endpoint discovery.

## Consistency and Fault Tolerance
- Critical alert registration via simplified 2PC:
  - Phase 1: prepare in replicas
  - Phase 2: commit/rollback decision by coordinator
- Timeout/retry policies for prepare/commit.
- Heartbeat and node liveness checks.
- Degraded mode when one replica is unavailable.

## Security (basic)
- Token-based auth for control and write operations.
- Read endpoints optionally public or token-protected by role.

## Docker Simulation
Suggested services in `docker-compose.yml`:
- coordinator
- sensor-1, sensor-2, sensor-3
- replica-a, replica-b
- web-client

## Frontend (React)
- Real-time telemetry panel
- Historical charts by zone/time
- Node health/status
- Critical alerts and transaction trace (prepare/commit/rollback)
