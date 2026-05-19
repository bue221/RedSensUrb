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
        if ("POST".equals(req.getMethod()) && req.getRequestURI().contains("/api/v1/alerts/critical")) {
            String auth = req.getHeader("Authorization");
            if (auth == null || !auth.equals("Bearer " + token)) {
                ((HttpServletResponse) response).setStatus(401);
                response.getWriter().write("unauthorized");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
