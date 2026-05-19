package com.redsensurb.contracts;

import java.io.Serializable;
import java.util.List;

public record TxOutcome(String txId, String decision, List<TxVote> votes) implements Serializable {}
