package com.redsensurb.coordinator.core;

import com.redsensurb.contracts.AlertTxRequest;
import com.redsensurb.contracts.CriticalAlertRequest;
import com.redsensurb.contracts.TxOutcome;
import com.redsensurb.contracts.TxVote;
import com.redsensurb.rmi.AlertParticipant;
import org.springframework.stereotype.Service;

import java.rmi.Naming;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TxCoordinatorService {
    private final AlertTxRepository alertTxRepository;

    public TxCoordinatorService(AlertTxRepository alertTxRepository) {
        this.alertTxRepository = alertTxRepository;
    }

    public TxOutcome run2pc(CriticalAlertRequest request) {
        String txId = UUID.randomUUID().toString();
        String[] endpoints = {
                System.getenv().getOrDefault("RMI_REPLICA_A", "rmi://replica-a:1099/replica-a"),
                System.getenv().getOrDefault("RMI_REPLICA_B", "rmi://replica-b:1099/replica-b")
        };
        List<TxVote> votes = new ArrayList<>();
        boolean allPrepared = true;

        for (String endpoint : endpoints) {
            try {
                AlertParticipant p = (AlertParticipant) Naming.lookup(endpoint);
                TxVote vote = p.prepare(new AlertTxRequest(txId, request));
                votes.add(vote);
                allPrepared &= vote.ok();
            } catch (Exception e) {
                votes.add(new TxVote(endpoint, false, e.getMessage()));
                allPrepared = false;
            }
        }

        String decision = allPrepared ? "COMMIT" : "ROLLBACK";
        for (String endpoint : endpoints) {
            try {
                AlertParticipant p = (AlertParticipant) Naming.lookup(endpoint);
                if (allPrepared) votes.add(p.commit(txId)); else votes.add(p.rollback(txId));
            } catch (Exception e) {
                votes.add(new TxVote(endpoint, false, "finalize_error:" + e.getMessage()));
            }
        }
        alertTxRepository.save(txId, request, decision);
        return new TxOutcome(txId, decision, votes);
    }
}
