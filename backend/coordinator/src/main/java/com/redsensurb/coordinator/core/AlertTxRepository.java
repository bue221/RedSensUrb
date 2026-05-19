package com.redsensurb.coordinator.core;

import com.redsensurb.contracts.CriticalAlertRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Repository
public class AlertTxRepository {
    private final JdbcTemplate jdbc;

    public AlertTxRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void save(String txId, CriticalAlertRequest req, String decision) {
        jdbc.update("INSERT INTO alert_transactions(tx_id, zone_id, metric, value, threshold, severity, source, decision, created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                txId, req.zoneId(), req.metric(), req.value(), req.threshold(), req.severity(), req.source(), decision, Instant.now().toString());
    }

    public List<Map<String, Object>> list(int limit) {
        return jdbc.queryForList("SELECT * FROM alert_transactions ORDER BY created_at DESC LIMIT ?", limit);
    }
}
