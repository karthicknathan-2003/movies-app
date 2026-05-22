package com.cinevault.cinevaultapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration class for TMDB (The Movie Database) API integration.
 * Configures the WebClient bean for making HTTP requests to the TMDB API.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Configuration
public class TmdbConfig {

    @Value("${tmdb.base-url}")
    private String baseUrl;

    /**
     * Creates a WebClient bean configured with the TMDB API base URL.
     * This client is used throughout the application to interact with TMDB services.
     *
     * @return - A configured {@code WebClient} instance for TMDB API requests.
     */
    @Bean
    public WebClient tmdbWebClient() {
        // Increase codec buffer limit to 10MB to handle large anime season payloads.
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(config -> config
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)  // 10MB
                )
                .build();
        return WebClient.builder()
                .baseUrl(baseUrl)
                .exchangeStrategies(strategies)
                .build();
    }
}