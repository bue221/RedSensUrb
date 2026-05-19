package com.redsensurb.contracts;

import java.io.Serializable;

public record AlertTxRequest(String txId, CriticalAlertRequest alert) implements Serializable {}
