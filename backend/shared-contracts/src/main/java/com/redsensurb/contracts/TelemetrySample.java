package com.redsensurb.contracts;

import java.io.Serializable;
import java.time.Instant;

public record TelemetrySample(String sensorId, String zoneId, Instant timestamp, double temperatureC, double humidityPct, int co2Ppm) implements Serializable {}
