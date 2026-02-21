package com.cinevault.cinevaultapp.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for enabling caching in the application.
 * Allows the use of Spring's caching annotations like {@code @Cacheable}.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@Configuration
@EnableCaching
public class CacheConfig {
}