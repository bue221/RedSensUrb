CREATE TABLE IF NOT EXISTS telemetry_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  temperature_c REAL NOT NULL,
  humidity_pct REAL NOT NULL,
  co2_ppm INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_transactions (
  tx_id TEXT PRIMARY KEY,
  zone_id TEXT,
  metric TEXT,
  value REAL,
  threshold REAL,
  severity TEXT,
  source TEXT,
  decision TEXT,
  created_at TEXT NOT NULL
);
