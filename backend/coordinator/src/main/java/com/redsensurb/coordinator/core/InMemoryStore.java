package com.redsensurb.coordinator.core;

import com.redsensurb.contracts.TelemetrySample;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class InMemoryStore {
    public final List<TelemetrySample> telemetry = new CopyOnWriteArrayList<>();
    public final Map<String, Instant> nodeLastSeen = new ConcurrentHashMap<>();
}
