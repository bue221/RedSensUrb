package com.redsensurb.sensor;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Random;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class SensorApplication {
    private static final AtomicBoolean running = new AtomicBoolean(true);
    private static final AtomicInteger rateMs = new AtomicInteger(Integer.parseInt(System.getenv().getOrDefault("SENSOR_RATE_MS", "2000")));
    private static volatile String fault = "NONE";

    public static void main(String[] args) throws Exception {
        String sensorId = System.getenv().getOrDefault("SENSOR_ID", "sensor-1");
        String zoneId = System.getenv().getOrDefault("ZONE_ID", "zone-north");
        String host = System.getenv().getOrDefault("COORDINATOR_HOST", "coordinator");
        int udpPort = Integer.parseInt(System.getenv().getOrDefault("COORDINATOR_UDP_PORT", "9000"));
        int tcpPort = Integer.parseInt(System.getenv().getOrDefault("SENSOR_TCP_PORT", "9101"));

        startControlServer(tcpPort);
        ScheduledExecutorService exec = Executors.newSingleThreadScheduledExecutor();
        Random random = new Random();
        exec.scheduleWithFixedDelay(() -> sendTelemetry(sensorId, zoneId, host, udpPort, random), 0, 1, TimeUnit.SECONDS);
        Thread.currentThread().join();
    }

    private static void sendTelemetry(String sensorId, String zoneId, String host, int port, Random random) {
        if (!running.get()) return;
        if ("NETWORK_DROP".equalsIgnoreCase(fault) && random.nextBoolean()) return;
        if ("DELAY".equalsIgnoreCase(fault)) {
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
        }
        String json = String.format("{\"sensorId\":\"%s\",\"zoneId\":\"%s\",\"timestamp\":\"%s\",\"temperatureC\":%.2f,\"humidityPct\":%.2f,\"co2Ppm\":%d}",
                sensorId, zoneId, Instant.now(), 18 + random.nextDouble() * 15, 30 + random.nextDouble() * 50, 450 + random.nextInt(1200));
        try (DatagramSocket socket = new DatagramSocket()) {
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            socket.send(new DatagramPacket(bytes, bytes.length, InetAddress.getByName(host), port));
            Thread.sleep(rateMs.get());
        } catch (Exception e) {
            System.err.println("send error: " + e.getMessage());
        }
    }

    private static void startControlServer(int tcpPort) {
        new Thread(() -> {
            try (ServerSocket server = new ServerSocket(tcpPort)) {
                while (true) {
                    try (Socket socket = server.accept();
                         BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                         PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
                        String cmd = in.readLine();
                        out.println(handleCommand(cmd));
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }, "sensor-tcp-control").start();
    }

    private static String handleCommand(String cmd) {
        if (cmd == null) return "ERR empty";
        if (cmd.equals("START")) { running.set(true); return "OK START"; }
        if (cmd.equals("STOP")) { running.set(false); return "OK STOP"; }
        if (cmd.startsWith("SET_RATE")) { rateMs.set(Integer.parseInt(cmd.split(" ")[1])); return "OK RATE"; }
        if (cmd.startsWith("INJECT_FAULT")) { fault = cmd.split(" ")[1]; return "OK FAULT " + fault; }
        if (cmd.equals("STATUS")) return "OK running=" + running.get() + " rateMs=" + rateMs.get() + " fault=" + fault;
        return "ERR unknown";
    }
}
