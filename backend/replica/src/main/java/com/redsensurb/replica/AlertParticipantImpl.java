package com.redsensurb.replica;

import com.redsensurb.contracts.AlertTxRequest;
import com.redsensurb.contracts.TxVote;
import com.redsensurb.rmi.AlertParticipant;

import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AlertParticipantImpl extends UnicastRemoteObject implements AlertParticipant {
    private final String replicaId;
    private final Map<String, String> txState = new ConcurrentHashMap<>();

    protected AlertParticipantImpl(String replicaId) throws RemoteException {
        super();
        this.replicaId = replicaId;
    }

    @Override
    public TxVote prepare(AlertTxRequest request) {
        txState.put(request.txId(), "PREPARED");
        return new TxVote(replicaId, true, "PREPARED");
    }

    @Override
    public TxVote commit(String txId) {
        txState.put(txId, "COMMITTED");
        return new TxVote(replicaId, true, "COMMITTED");
    }

    @Override
    public TxVote rollback(String txId) {
        txState.put(txId, "ROLLED_BACK");
        return new TxVote(replicaId, true, "ROLLED_BACK");
    }

    @Override
    public String health() {
        return "UP";
    }
}
