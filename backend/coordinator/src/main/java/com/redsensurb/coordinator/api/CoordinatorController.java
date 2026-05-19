package com.redsensurb.coordinator.api;

import com.redsensurb.contracts.CriticalAlertRequest;
import com.redsensurb.contracts.TelemetrySample;
import com.redsensurb.contracts.TxOutcome;
import com.redsensurb.coordinator.core.AlertTxRepository;
import com.redsensurb.coordinator.core.InMemoryStore;
import com.redsensurb.coordinator.core.TelemetryRepository;
import com.redsensurb.coordinator.core.TxCoordinatorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CoordinatorController {
    private final InMemoryStore store;
    private final TelemetryRepository telemetryRepository;
    private final AlertTxRepository alertTxRepository;
    private final TxCoordinatorService tx;

    public CoordinatorController(InMemoryStore store, TelemetryRepository telemetryRepository, AlertTxRepository alertTxRepository, TxCoordinatorService tx) {
        this.store = store;
        this.telemetryRepository = telemetryRepository;
        this.alertTxRepository = alertTxRepository;
        this.tx = tx;
    }

    @GetMapping("/telemetry")
    public List<TelemetrySample> telemetry(@RequestParam(name = "zoneId", required = false) String zoneId, @RequestParam(name = "limit", defaultValue = "100") int limit) {
        return telemetryRepository.find(zoneId, limit);
    }

    @GetMapping("/nodes/status")
    public Map<String, Object> status() { return Map.of("nodes", store.nodeLastSeen); }

    @GetMapping("/alerts")
    public List<Map<String, Object>> alerts(@RequestParam(name = "limit", defaultValue = "50") int limit) {
        return alertTxRepository.list(limit);
    }

    @PostMapping("/alerts/critical")
    public TxOutcome critical(@RequestBody CriticalAlertRequest request) {
        return tx.run2pc(request);
    }
}
