package com.propro.warehouse.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the Expo web app to call this API from a browser.
 *
 * Without CORS, browser preflight fails and fetch() looks like a network error.
 * Native apps do not send Origin and are unaffected.
 *
 * Localhost is always allowed. Add production frontends with
 * CORS_ALLOWED_ORIGINS (comma-separated), e.g.
 * https://warehousepro.vercel.app,https://www.example.com
 */
@Configuration
public class CorsConfig {

    @Value("${CORS_ALLOWED_ORIGINS:}")
    private String extraOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                List<String> patterns = new ArrayList<>(List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        // Hosted Expo web (Vercel)
                        "https://*.vercel.app",
                        "https://warehouse-pro-kappa.vercel.app"));

                if (extraOrigins != null && !extraOrigins.isBlank()) {
                    Arrays.stream(extraOrigins.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(patterns::add);
                }

                registry.addMapping("/api/**")
                        .allowedOriginPatterns(patterns.toArray(String[]::new))
                        // PATCH is required for pick + complete order endpoints.
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .maxAge(3600);
            }
        };
    }
}
