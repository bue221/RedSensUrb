package com.redsensurb.coordinator.core;

import com.redsensurb.contracts.TelemetrySample;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public class TelemetryRepository {
    private final JdbcTemplate jdbc;

    public TelemetryRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void save(TelemetrySample sample) {
        jdbc.update("INSERT INTO telemetry_samples(sensor_id, zone_id, ts, temperature_c, humidity_pct, co2_ppm) VALUES(?,?,?,?,?,?)",
                sample.sensorId(), sample.zoneId(), sample.timestamp().toString(), sample.temperatureC(), sample.humidityPct(), sample.co2Ppm());
    }

    public List<TelemetrySample> find(String zoneId, int limit) {
        String sql = zoneId == null
                ? "SELECT sensor_id, zone_id, ts, temperature_c, humidity_pct, co2_ppm FROM telemetry_samples ORDER BY id DESC LIMIT ?"
                : "SELECT sensor_id, zone_id, ts, temperature_c, humidity_pct, co2_ppm FROM telemetry_samples WHERE zone_id = ? ORDER BY id DESC LIMIT ?";
        Object[] args = zoneId == null ? new Object[]{limit} : new Object[]{zoneId, limit};
        return jdbc.query(sql, args, (rs, n) -> new TelemetrySample(
                rs.getString("sensor_id"),
                rs.getString("zone_id"),
                Instant.parse(rs.getString("ts")),
                rs.getDouble("temperature_c"),
                rs.getDouble("humidity_pct"),
                rs.getInt("co2_ppm")
        ));
    }
}
