package com.redsensurb.replica;

import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

public class ReplicaApplication {
    public static void main(String[] args) throws Exception {
        String replicaId = System.getenv().getOrDefault("REPLICA_ID", "replica-a");
        int rmiPort = Integer.parseInt(System.getenv().getOrDefault("RMI_REGISTRY_PORT", "1099"));
        String bindName = System.getenv().getOrDefault("RMI_BIND_NAME", replicaId);

        Registry registry;
        try {
            registry = LocateRegistry.createRegistry(rmiPort);
        } catch (Exception e) {
            registry = LocateRegistry.getRegistry(rmiPort);
        }

        registry.rebind(bindName, new AlertParticipantImpl(replicaId));
        System.out.println("Replica bound: " + bindName + " on port " + rmiPort);
        Thread.currentThread().join();
    }
}
