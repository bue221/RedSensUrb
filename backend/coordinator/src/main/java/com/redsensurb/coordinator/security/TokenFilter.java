package com.redsensurb.coordinator.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class TokenFilter implements Filter {
    @Value("${app.api.token:changeme-token}")
    private String token;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        if ("POST".equals(req.getMethod()) && req.getRequestURI().contains("/api/v1/alerts/critical")) {
            String auth = req.getHeader("Authorization");
            if (auth == null || !auth.equals("Bearer " + token)) {
                // Ensure CORS headers are present so browsers surface the 401
                // instead of a misleading "CORS error". Mirrors the request Origin.
                String origin = req.getHeader("Origin");
                if (origin != null && !origin.isBlank()) {
                    res.setHeader("Access-Control-Allow-Origin", origin);
                    res.setHeader("Vary", "Origin");
                    res.setHeader("Access-Control-Allow-Credentials", "true");
                }
                res.setStatus(401);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"unauthorized\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
