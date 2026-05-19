# Video explicativo Hypermotion

## Objetivo
Generar un video corto para defensa de Red-SensUrb, enfocado en explicar el MVP distribuido sin entrar en detalles de implementación línea por línea.

## Mensaje central
Red-SensUrb usa sensores Java que envían telemetría por UDP, un coordinator Spring Boot que persiste y expone REST, y réplicas RMI coordinadas con 2PC para alertas críticas. SQLite conserva histórico y auditoría; React permite observar el estado mínimo del sistema.

## Estructura del video
1. Presentación del proyecto.
2. Ingesta de telemetría: sensores Java -> UDP -> coordinator.
3. Consulta y persistencia: REST + SQLite.
4. Alerta crítica: cliente -> coordinator -> réplicas RMI.
5. Resultado: frontend React y defensa del MVP.

## Regenerar
```bash
./tools/render_hypermotion_video.sh
```

Salida esperada:

```text
media/redsensurb-hypermotion.mp4
```
