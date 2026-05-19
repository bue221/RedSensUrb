package com.redsensurb.coordinator.udp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redsensurb.contracts.TelemetrySample;
import com.redsensurb.coordinator.core.InMemoryStore;
import com.redsensurb.coordinator.core.TelemetryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.nio.charset.StandardCharsets;

@Component
public class UdpIngestService {
    private final InMemoryStore store;
    private final TelemetryRepository telemetryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Value("${app.udp.port:9000}")
    private int udpPort;

    public UdpIngestService(InMemoryStore store, TelemetryRepository telemetryRepository) {
        this.store = store;
        this.telemetryRepository = telemetryRepository;
    }

    @PostConstruct
    void start() {
        Thread.startVirtualThread(() -> {
            try (DatagramSocket server = new DatagramSocket(udpPort)) {
                byte[] buf = new byte[4096];
                while (true) {
                    DatagramPacket packet = new DatagramPacket(buf, buf.length);
                    server.receive(packet);
                    String json = new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8);
                    TelemetrySample sample = objectMapper.readValue(json, TelemetrySample.class);
                    telemetryRepository.save(sample);
                    store.nodeLastSeen.put(sample.sensorId(), sample.timestamp());
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }
}
