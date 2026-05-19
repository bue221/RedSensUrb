package com.redsensurb.coordinator.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split("\\s*,\\s*");
        boolean wildcard = origins.length == 1 && "*".equals(origins[0]);
        var mapping = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Type", "Authorization")
                .maxAge(3600);
        if (wildcard) {
            // allowedOriginPatterns is required when credentials are allowed,
            // and also works as a permissive default for dev.
            mapping.allowedOriginPatterns("*").allowCredentials(false);
        } else {
            mapping.allowedOrigins(origins).allowCredentials(true);
        }
    }
}
