package com.redsensurb.rmi;

import com.redsensurb.contracts.AlertTxRequest;
import com.redsensurb.contracts.TxVote;

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface AlertParticipant extends Remote {
    TxVote prepare(AlertTxRequest request) throws RemoteException;
    TxVote commit(String txId) throws RemoteException;
    TxVote rollback(String txId) throws RemoteException;
    String health() throws RemoteException;
}
