package com.redsensurb.contracts;

import java.io.Serializable;

public record TxVote(String replicaId, boolean ok, String message) implements Serializable {}
