package com.redsensurb.contracts;

import java.io.Serializable;

public record CriticalAlertRequest(String zoneId, String metric, double value, double threshold, String severity, String source) implements Serializable {}
