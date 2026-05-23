package com.cinevault.cinevaultapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

/**
 * Global CORS configuration for the application.
 *
 * This configuration allows communication between frontend and backend applications.
 * CORS is required because the frontend and backend are running on different domains/ports.
 *
 * @author karthicknathan
 * @since May 23, 2025
 *
 * @version 1.0
 */
@Configuration
public class CorsConfig {
    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * Creates and registers the global CORS configuration.
     *
     * @return configured CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        //  Main CORS configuration object
        CorsConfiguration configuration = new CorsConfiguration();
        //  Allowed origins.
        configuration.setAllowedOrigins(List.of(
                frontendUrl,
                "http://localhost:5173"
        ));
        //  Allowed HTTP methods from requests.
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"
        ));
        //  Allows all request headers. Includes: Authorization, Content-Type, Accept, etc.
        configuration.setAllowedHeaders(List.of("*"));
        //  Allows cookies, authorization headers, and authenticated requests.
        configuration.setAllowCredentials(true);
        //  Registers the CORS configuration for all application endpoints.
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}