# Guía para defensa/presentación

## Qué demostrar en vivo
1. Arrancar todo con Docker Compose.
2. Ver nodos activos (`/nodes/status`).
3. Ver telemetría (`/telemetry`).
4. Disparar alerta crítica con token (`/alerts/critical`).
5. Mostrar resultado persistido (`/alerts`).

## Mensaje técnico corto
- “Usamos UDP para flujo de sensores, RMI para coordinación distribuida de alertas críticas y SQLite para histórico/auditoría reproducible.”
- “La consistencia de alerta crítica se resuelve con 2PC simplificado.”

## Limitaciones actuales (honestas)
- SOAP aún no implementado en este MVP.
- Sin retries/timeout finos ni política degradada completa.
- Frontend básico, enfocado en observabilidad mínima.
