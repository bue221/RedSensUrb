COMPOSE := docker-compose -f deploy/docker-compose.yml
TOKEN ?= changeme-token
BASE ?= http://localhost:8080

.DEFAULT_GOAL := help

## help: Muestra esta ayuda
help:
	@echo ""
	@echo "Red-SensUrb - comandos disponibles"
	@echo ""
	@awk '/^## / {sub(/^## /,""); print "  " $$0}' $(MAKEFILE_LIST)
	@echo ""

## build: Construye todas las imagenes
build:
	$(COMPOSE) build

## up: Levanta backend (coordinator + replicas + sensores) en background
up:
	$(COMPOSE) up --build -d coordinator replica-a replica-b sensor-1 sensor-2 sensor-3

## up-all: Levanta todo incluyendo web-client
up-all:
	$(COMPOSE) up --build -d

## down: Detiene y elimina contenedores
down:
	$(COMPOSE) down

## restart: Reinicia backend
restart: down up

## ps: Lista contenedores
ps:
	$(COMPOSE) ps

## logs: Muestra logs en vivo
logs:
	$(COMPOSE) logs -f

## logs-coord: Logs del coordinator
logs-coord:
	docker logs -f redsensurb-coordinator-1

## logs-replicas: Logs de las dos replicas
logs-replicas:
	docker logs --tail 50 redsensurb-replica-a-1; \
	docker logs --tail 50 redsensurb-replica-b-1

## status: Estado de nodos via API
status:
	curl -s $(BASE)/api/v1/nodes/status | sed 's/,/,\n/g'

## telemetry: Ultimas 5 muestras de telemetria
telemetry:
	curl -s "$(BASE)/api/v1/telemetry?limit=5"

## alert: Dispara alerta critica (2PC RMI)
alert:
	curl -s -X POST $(BASE)/api/v1/alerts/critical \
	  -H "Authorization: Bearer $(TOKEN)" \
	  -H "Content-Type: application/json" \
	  -d '{"zoneId":"zone-north","metric":"co2Ppm","value":1400,"threshold":1200,"severity":"CRITICAL","source":"demo"}'

## alerts: Lista alertas persistidas en SQLite
alerts:
	curl -s "$(BASE)/api/v1/alerts?limit=10"

## fault-replica-a: Simula caida de replica-a
fault-replica-a:
	docker stop redsensurb-replica-a-1

## fault-replica-b: Simula caida de replica-b
fault-replica-b:
	docker stop redsensurb-replica-b-1

## recover: Recupera ambas replicas
recover:
	docker start redsensurb-replica-a-1 redsensurb-replica-b-1

## clean: Detiene y borra volumenes (resetea SQLite)
clean:
	$(COMPOSE) down -v

## demo: Flujo demo completo end-to-end
demo: up
	@sleep 5
	@echo "==> status"; $(MAKE) -s status; echo ""
	@echo "==> telemetry"; $(MAKE) -s telemetry; echo ""
	@echo "==> alert (commit esperado)"; $(MAKE) -s alert; echo ""
	@echo "==> alerts persistidas"; $(MAKE) -s alerts; echo ""

.PHONY: help build up up-all down restart ps logs logs-coord logs-replicas \
	status telemetry alert alerts fault-replica-a fault-replica-b recover clean demo
